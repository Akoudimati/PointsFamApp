// PointsFam - Messaging JavaScript

class MessagingManager {
    constructor() {
        this.currentConversationId = null;
        this.currentUser = null;
        this.conversations = [];
        this.familyMembers = [];
        this.familyName = '';
        this.selectedUsers = [];
        this.searchTimeout = null;
        this.messagePollingInterval = null;
        this.isDashboard = window.location.pathname === '/dashboard.html' || window.location.pathname === '/dashboard';
    }

    async init() {
        await this.checkAuthentication();
        if (!this.isDashboard) {
            await this.loadConversations();
            this.setupEventListeners();
        }
        this.startMessagePolling();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const userData = await response.json();
            this.currentUser = userData.user;
            
            // Update user info in navigation
            document.getElementById('user-name').textContent = 
                `${userData.user.firstName} ${userData.user.lastName}`;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.showNotification('Er is een fout opgetreden bij het controleren van authenticatie.', 'danger');
            setTimeout(() => window.location.href = '/login.html', 2000);
        }
    }

    async loadConversations() {
        try {
            console.log('Loading family conversations...');
            const response = await fetch('/api/conversations?family_only=true', {
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Family conversations loaded:', data);
            this.conversations = data.conversations || [];
            this.renderConversations();
            
            // Also load family members
            await this.loadFamilyMembers();
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showNotification('Er is een fout opgetreden bij het laden van gesprekken.', 'danger');
            this.renderConversationsError();
        }
    }

    async loadFamilyMembers() {
        try {
            console.log('Loading family members...');
            const response = await fetch('/api/family/members', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Family members loaded:', data);
            this.familyMembers = data.family_members || [];
            this.familyName = data.family_name || 'Familie';
            this.renderFamilyMembers();
            
        } catch (error) {
            console.error('Error loading family members:', error);
            this.showNotification('Er is een fout opgetreden bij het laden van familieleden.', 'danger');
        }
    }

    renderConversationsError() {
        const conversationsList = document.getElementById('conversations-list');
        conversationsList.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                <h6>Laden mislukt</h6>
                <p class="text-muted">Er is een probleem opgetreden bij het laden van je gesprekken.</p>
                <button class="btn btn-outline-primary btn-sm" onclick="messagingManager.loadConversations()">
                    <i class="fas fa-redo me-1"></i>
                    Probeer opnieuw
                </button>
            </div>
        `;
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversations-list');
        
        if (!this.conversations || this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen familie gesprekken</h5>
                    <p class="text-muted">Start een familie gesprek om te beginnen</p>
                </div>
            `;
            return;
        }

        const conversationsHTML = this.conversations.map(conversation => {
            const title = conversation.title || this.getConversationTitle(conversation);
            const lastMessage = conversation.last_message_content || 'Nog geen berichten';
            const timeAgo = this.formatTimeAgo(conversation.last_message_at || conversation.created_at);
            const unreadCount = conversation.unread_count || 0;
            const typeBadge = this.getConversationTypeBadge(conversation.type);
            
            return `
                <div class="conversation-item p-3 border-bottom" data-conversation-id="${conversation.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <h6 class="mb-0">${this.escapeHtml(title)}</h6>
                                ${typeBadge}
                            </div>
                            <div class="conversation-last-message">${this.escapeHtml(lastMessage)}</div>
                        </div>
                        <div class="text-end">
                            <div class="conversation-time">${timeAgo}</div>
                            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        conversationsList.innerHTML = conversationsHTML;
    }

    renderFamilyMembers() {
        // Add family members section to the conversations sidebar
        const conversationsList = document.getElementById('conversations-list');
        
        if (!this.familyMembers || this.familyMembers.length === 0) {
            return;
        }

        const familyMembersHTML = `
            <div class="family-members-section border-bottom">
                <div class="p-3 bg-light">
                    <h6 class="mb-0 text-primary">
                        <i class="fas fa-users me-2"></i>
                        ${this.escapeHtml(this.familyName)}
                    </h6>
                </div>
                <div class="family-members-list">
                    ${this.familyMembers.map(member => `
                        <div class="family-member-item p-2 border-bottom" data-member-id="${member.id}">
                            <div class="d-flex align-items-center">
                                <div class="family-member-avatar me-2" style="background-color: ${member.avatar_color}">
                                    ${member.first_name.charAt(0).toUpperCase()}
                                </div>
                                <div class="flex-grow-1">
                                    <div class="family-member-name">${this.escapeHtml(member.first_name)} ${this.escapeHtml(member.last_name)}</div>
                                    <div class="family-member-role">
                                        <i class="fas fa-${member.role === 'parent' ? 'user-tie' : 'child'} me-1"></i>
                                        ${member.role === 'parent' ? 'Ouder' : 'Kind'}
                                        ${member.points ? `• ${member.points} punten` : ''}
                                    </div>
                                </div>
                                <div class="family-member-status ${member.online_status}">
                                    <i class="fas fa-circle" title="${member.online_status === 'online' ? 'Online' : 'Offline'}"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Insert family members before conversations
        conversationsList.innerHTML = familyMembersHTML + conversationsList.innerHTML;
    }

    getConversationTitle(conversation) {
        if (conversation.title) return conversation.title;
        
        switch (conversation.type) {
            case 'family':
                return `${this.familyName || 'Familie'} Chat`;
            case 'group':
                return 'Groepsgesprek';
            case 'direct':
                return 'Direct bericht';
            default:
                return 'Gesprek';
        }
    }

    getConversationTypeBadge(type) {
        switch (type) {
            case 'family':
                return '<span class="conversation-type-badge family-badge text-white">Familie</span>';
            case 'group':
                return '<span class="conversation-type-badge group-badge text-white">Groep</span>';
            case 'direct':
                return '<span class="conversation-type-badge direct-badge text-white">Direct</span>';
            case 'cross_family':
                return '<span class="conversation-type-badge bg-warning text-dark">Cross-Familie</span>';
            default:
                return '';
        }
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Nu';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u`;
        return `${Math.floor(diffInMinutes / 1440)}d`;
    }

    setupEventListeners() {
        // Conversation selection
        document.getElementById('conversations-list').addEventListener('click', (e) => {
            const conversationItem = e.target.closest('.conversation-item');
            if (conversationItem) {
                const conversationId = conversationItem.dataset.conversationId;
                this.selectConversation(conversationId);
            }
        });

        // Message form submission
        document.getElementById('message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Message input auto-resize
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });

        // Enter key to send message (Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // New chat form
        document.getElementById('new-chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewChat();
        });

        // Chat type selection
        document.getElementById('chat-type').addEventListener('change', (e) => {
            this.updateNewChatForm(e.target.value);
        });

        // User search
        document.getElementById('user-search').addEventListener('input', (e) => {
            this.handleUserSearch(e.target.value);
        });

        // Mobile navigation
        document.getElementById('mobile-conversations-toggle').addEventListener('click', () => {
            document.getElementById('conversations-sidebar').classList.add('show');
        });

        document.getElementById('mobile-back-button').addEventListener('click', () => {
            document.getElementById('conversations-sidebar').classList.remove('show');
        });

        // Logout functionality
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.logout();
        });
    }

    async selectConversation(conversationId) {
        try {
            console.log('Selecting conversation:', conversationId);
            
            // Validate conversationId
            if (!conversationId) {
                console.error('Invalid conversation ID');
                this.showNotification('Geen geldig gesprek geselecteerd', 'danger');
                return;
            }

            // Fetch conversation details
            const response = await fetch(`/api/conversations/${conversationId}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Conversation fetch error:', errorData);
                this.showNotification(`Fout bij laden gesprek: ${errorData.error || 'Onbekende fout'}`, 'danger');
                return;
            }

            const { conversation, participants } = await response.json();
            console.log('Conversation details:', conversation);
            console.log('Conversation participants:', participants);

            // Render chat area
            this.renderChatArea(conversation, participants);

            // Load messages
            await this.loadMessages(conversationId);

            // Update UI state
            const conversationElements = document.querySelectorAll('.conversation-item');
            conversationElements.forEach(el => {
                el.classList.remove('active');
                if (el.dataset.conversationId === conversationId) {
                    el.classList.add('active');
                }
            });

        } catch (error) {
            console.error('Error selecting conversation:', error);
            this.showNotification(`Fout bij selecteren gesprek: ${error.message}`, 'danger');
        }
    }

    renderChatArea(conversation, participants) {
        const title = conversation.title || this.getConversationTitle(conversation);
        const participantNames = participants.map(p => `${p.first_name} ${p.last_name}`).join(', ');
        
        document.getElementById('chat-title').textContent = title;
        document.getElementById('chat-participants').textContent = participantNames;
        
        // Show chat area
        document.getElementById('no-chat-selected').classList.add('d-none');
        document.getElementById('active-chat').classList.remove('d-none');
    }

    async loadMessages(conversationId) {
        try {
            console.log('Loading messages for conversation:', conversationId);
            
            // Validate conversationId
            if (!conversationId) {
                console.error('No conversation ID provided');
                this.showNotification('Geen gesprek geselecteerd', 'danger');
                return;
            }

            this.currentConversationId = conversationId;

            // Show loading state
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="loading-messages">
                        <div class="loading-spinner"></div>
                        <p>Berichten laden...</p>
                    </div>
                `;
            }

            // Fetch messages with detailed logging
            console.log('Fetching messages with parameters:', {
                conversationId,
                limit: 50,
                offset: 0
            });

            const response = await fetch(`/api/conversations/${conversationId}/messages?limit=50&offset=0`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('Messages API full response:', data);
            
            if (!response.ok) {
                // More detailed error handling
                const errorMessage = data.error || `HTTP error! status: ${response.status}`;
                console.error('Message loading error:', errorMessage);
                throw new Error(errorMessage);
            }
            
            if (!Array.isArray(data.messages)) {
                console.error('Invalid messages data:', data);
                throw new Error('Ongeldige berichtgegevens ontvangen');
            }
            
            console.log(`Loaded ${data.messages.length} messages`);
            
            // Render messages with additional logging
            console.log('Rendering messages:', data.messages);
            this.renderMessages(data.messages);
            
        } catch (error) {
            console.error('Error loading messages:', error);
            
            // More detailed error state in UI
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Er is een fout opgetreden bij het laden van berichten:
                        <p class="text-danger">${error.message || 'Onbekende fout'}</p>
                        <button class="btn btn-link btn-sm" onclick="messagingManager.loadMessages('${conversationId}')">
                            Opnieuw proberen
                        </button>
                    </div>
                `;
            }
            
            this.showNotification(`Fout bij laden berichten: ${error.message || 'Onbekende fout'}`, 'danger');
        }
    }

    renderMessages(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen berichten</h5>
                    <p class="text-muted">Begin een gesprek door een bericht te sturen</p>
                </div>
            `;
            return;
        }

        // Group messages by date and sender
        const groupedMessages = this.groupMessages(messages);
        let messagesHTML = '';

        groupedMessages.forEach((groupObj) => {
            const isCurrentUser = groupObj.senderId === this.currentUser.id;
            const messageAlignment = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
            const messageStyle = isCurrentUser ? 'sent' : 'received';

            messagesHTML += `
                <div class="message-group ${messageAlignment}">
                    ${groupObj.messages.map((message, msgIndex) => {
                        const time = this.formatMessageTime(message.created_at);
                        const isFirstInGroup = msgIndex === 0;

                        return `
                            <div class="message ${messageStyle} ${isFirstInGroup ? 'with-avatar' : ''}" data-message-id="${message.id}">
                                ${isFirstInGroup && !isCurrentUser ? `
                                    <div class="message-avatar" style="background-color: ${this.getAvatarColor(message.sender_first_name)}">
                                        ${message.sender_first_name.charAt(0).toUpperCase()}
                                    </div>
                                ` : ''}
                                <div class="message-content">
                                    ${isFirstInGroup && !isCurrentUser ? `
                                        <div class="message-sender">
                                            ${this.escapeHtml(message.sender_first_name)} ${this.escapeHtml(message.sender_last_name)}
                                        </div>
                                    ` : ''}
                                    <div class="message-text">
                                        ${this.formatMessageContent(message.content)}
                                    </div>
                                    <div class="message-time">
                                        ${time}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        chatMessages.innerHTML = messagesHTML;
        this.scrollToBottom(chatMessages);
        this.markVisibleMessagesAsRead();
    }

    groupMessages(messages) {
        const groups = [];
        let currentGroup = null;
        
        messages.forEach(message => {
            const shouldStartNewGroup = !currentGroup || 
                currentGroup.senderId !== message.sender_id ||
                this.shouldBreakMessageGroup(currentGroup.lastMessageTime, message.created_at);
            
            if (shouldStartNewGroup) {
                currentGroup = {
                    senderId: message.sender_id,
                    senderName: `${message.sender_first_name} ${message.sender_last_name}`,
                    lastMessageTime: message.created_at,
                    messages: []
                };
                groups.push(currentGroup);
            }
            
            currentGroup.messages.push(message);
            currentGroup.lastMessageTime = message.created_at;
        });
        
        return groups;
    }

    shouldBreakMessageGroup(lastTime, currentTime) {
        const timeDiff = new Date(currentTime) - new Date(lastTime);
        return timeDiff > 5 * 60 * 1000; // 5 minutes
    }

    formatMessageContent(content) {
        // Basic formatting: convert URLs to links, newlines to <br>
        let formatted = this.escapeHtml(content);
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    scrollToBottom(container, smooth = true) {
        if (smooth) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }

    async markVisibleMessagesAsRead() {
        if (!this.currentConversationId) return;
        
        try {
            // Get all message elements in the current conversation
            const messageElements = document.querySelectorAll('[data-message-id]');
            
            for (const element of messageElements) {
                const messageId = element.dataset.messageId;
                if (messageId) {
                    // Mark as read (fire and forget - don't wait for response)
                    fetch(`/api/messages/${messageId}/read`, {
                        method: 'POST',
                        credentials: 'include'
                    }).catch(error => {
                        console.debug('Error marking message as read:', error);
                    });
                }
            }
        } catch (error) {
            console.debug('Error marking messages as read:', error);
        }
    }

    formatMessageTime(timestamp) {
        const messageTime = new Date(timestamp);
        const now = new Date();
        const isToday = messageTime.toDateString() === now.toDateString();
        
        if (isToday) {
            return messageTime.toLocaleTimeString('nl-NL', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return messageTime.toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    async sendMessage() {
        try {
            const messageInput = document.getElementById('message-input');
            const content = messageInput.value.trim();
            
            if (!content || !this.currentConversationId) {
                return;
            }
            
            console.log('Sending message to conversation:', this.currentConversationId);
            console.log('Message content:', content);
            
            const response = await fetch(`/api/conversations/${this.currentConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    content,
                    conversation_id: this.currentConversationId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Message sent response:', data);
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to send message');
            }
            
            messageInput.value = '';
            messageInput.style.height = 'auto';
            await this.loadMessages(this.currentConversationId);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Er is een fout opgetreden bij het verzenden van je bericht.', 'danger');
        }
    }

    updateNewChatForm(chatType) {
        const titleGroup = document.getElementById('chat-title-group');
        const userSearchGroup = document.getElementById('user-search-group');
        const selectedUsersGroup = document.getElementById('selected-users-group');
        
        if (chatType === 'family') {
            titleGroup.classList.add('d-none');
            userSearchGroup.classList.add('d-none');
            selectedUsersGroup.classList.add('d-none');
        } else {
            titleGroup.classList.remove('d-none');
            userSearchGroup.classList.remove('d-none');
            selectedUsersGroup.classList.remove('d-none');
        }
    }

    async handleUserSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(async () => {
            await this.searchUsers(query);
        }, 300);
    }

    async searchUsers(query) {
        if (!query || query.length < 2) {
            document.getElementById('user-search-dropdown').classList.add('d-none');
            return;
        }

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.renderUserSearchResults(data.users);
            
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }

    renderUserSearchResults(users) {
        const dropdown = document.getElementById('user-search-dropdown');
        
        if (!users || users.length === 0) {
            dropdown.innerHTML = '<div class="user-search-item text-muted">Geen gebruikers gevonden</div>';
            dropdown.classList.remove('d-none');
            return;
        }

        const usersHTML = users.map(user => {
            const isSelected = this.selectedUsers.some(selected => selected.id === user.id);
            const familyBadge = user.family_name !== this.currentUser.familyName ? 
                `<span class="badge bg-secondary ms-2">${user.family_name}</span>` : '';
            
            return `
                <div class="user-search-item ${isSelected ? 'bg-light' : ''}" 
                     data-user-id="${user.id}" 
                     data-user-name="${user.first_name} ${user.last_name}">
                    ${user.first_name} ${user.last_name} 
                    <span class="badge bg-primary">${user.role}</span>
                    ${familyBadge}
                </div>
            `;
        }).join('');

        dropdown.innerHTML = usersHTML;
        dropdown.classList.remove('d-none');
        
        // Add click handlers
        dropdown.querySelectorAll('.user-search-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = parseInt(item.dataset.userId);
                const userName = item.dataset.userName;
                
                if (!this.selectedUsers.some(u => u.id === userId)) {
                    this.selectedUsers.push({ id: userId, name: userName });
                    this.renderSelectedUsers();
                }
                
                document.getElementById('user-search').value = '';
                dropdown.classList.add('d-none');
            });
        });
    }

    renderSelectedUsers() {
        const selectedUsersContainer = document.getElementById('selected-users');
        
        if (this.selectedUsers.length === 0) {
            selectedUsersContainer.innerHTML = '<p class="text-muted">Geen gebruikers geselecteerd</p>';
            return;
        }

        const usersHTML = this.selectedUsers.map(user => `
            <span class="badge bg-primary d-flex align-items-center">
                ${user.name}
                <button type="button" class="btn-close btn-close-white ms-2" 
                        data-user-id="${user.id}" 
                        aria-label="Verwijder"></button>
            </span>
        `).join('');

        selectedUsersContainer.innerHTML = usersHTML;
        
        // Add remove handlers
        selectedUsersContainer.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = parseInt(btn.dataset.userId);
                this.selectedUsers = this.selectedUsers.filter(u => u.id !== userId);
                this.renderSelectedUsers();
            });
        });
    }

    async createNewChat() {
        const chatType = document.getElementById('chat-type').value;
        const chatTitle = document.getElementById('new-chat-title').value.trim();
        
        try {
            let requestData = {
                type: chatType
            };
            
            if (chatType === 'family') {
                requestData.title = 'Familie Chat';
            } else {
                if (chatType === 'group' && !chatTitle) {
                    this.showNotification('Geef het groepsgesprek een naam.', 'warning');
                    return;
                }
                
                if (this.selectedUsers.length === 0) {
                    this.showNotification('Selecteer minimaal één gebruiker.', 'warning');
                    return;
                }
                
                requestData.title = chatTitle || null;
                requestData.participants = this.selectedUsers.map(u => u.id);
            }
            
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newChatModal'));
            modal.hide();
            
            // Reset form
            this.resetNewChatForm();
            
            // Reload conversations
            await this.loadConversations();
            
            // Select the new conversation
            this.selectConversation(data.conversationId);
            
            this.showNotification('Gesprek succesvol aangemaakt!', 'success');
            
        } catch (error) {
            console.error('Error creating new chat:', error);
            this.showNotification('Er is een fout opgetreden bij het aanmaken van het gesprek.', 'danger');
        }
    }

    resetNewChatForm() {
        document.getElementById('new-chat-form').reset();
        document.getElementById('user-search').value = '';
        document.getElementById('user-search-dropdown').classList.add('d-none');
        this.selectedUsers = [];
        this.renderSelectedUsers();
        this.updateNewChatForm('direct');
    }

    startMessagePolling() {
        // Clear any existing polling
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
        }
        
        // Poll for new messages every 10 seconds
        this.messagePollingInterval = setInterval(async () => {
            if (this.currentConversationId) {
                await this.loadMessages(this.currentConversationId);
            }
        }, 10000);
    }

    stopMessagePolling() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.stopMessagePolling();
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Er is een fout opgetreden bij het uitloggen.', 'danger');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const alertContainer = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-dismiss after duration
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, duration);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getAvatarColor(name) {
        const colors = [
            '#4CAF50', // Green for parents
            '#2196F3', // Blue for children
            '#9C27B0', // Purple for others
        ];
        
        const charCode = name.toLowerCase().charCodeAt(0) - 97;
        return colors[charCode % colors.length];
    }
}

// Initialize the messaging manager
const messagingManager = new MessagingManager();

document.addEventListener('DOMContentLoaded', async () => {
    await messagingManager.init();
}); 