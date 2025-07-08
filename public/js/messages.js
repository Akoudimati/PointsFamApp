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
        this.lastMessageCount = 0;
        this.lastMessageTimestamp = null;
        this.isDashboard = window.location.pathname === '/dashboard.html' || window.location.pathname === '/dashboard';
        this.isLoadingMessages = false;
        this.messageCache = new Map(); // Cache for messages
    }

    async init() {
        await this.checkAuthentication();
        if (!this.isDashboard) {
            await this.loadConversations();
            this.setupEventListeners();
        }
        // Don't start polling on init - only when conversation is selected
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
            // Show loading state
            const conversationsList = document.getElementById('conversations-list');
            conversationsList.innerHTML = `
                <div class="loading-conversations text-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Laden...</span>
                    </div>
                    <p class="mt-2 text-muted">Gesprekken laden...</p>
                </div>
            `;

            console.log('Loading family conversations...');
            const response = await fetch('/api/conversations?family_only=true', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Authentication required, redirecting to login');
                    window.location.href = '/login.html';
                    return;
                }
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Family conversations loaded:', data);
            
            // Store conversations
            this.conversations = data.conversations || [];
            console.log('Stored conversations:', this.conversations.length);
            
            // Clear loading state and render conversations
            conversationsList.innerHTML = '';
            this.renderConversations();
            
            // Load family members after conversations
            await this.loadFamilyMembers();
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showNotification(`Er is een fout opgetreden bij het laden van gesprekken: ${error.message}`, 'danger');
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
                <div class="no-conversations text-center p-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen familie gesprekken</h5>
                    <p class="text-muted">Start een gesprek om te beginnen</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#newChatModal">
                        <i class="fas fa-plus me-1"></i>
                        Nieuw gesprek
                    </button>
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
                            <div class="conversation-last-message text-muted">
                                ${this.escapeHtml(lastMessage)}
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="conversation-time text-muted small">${timeAgo}</div>
                            ${unreadCount > 0 ? `
                                <span class="badge bg-primary rounded-pill">${unreadCount}</span>
                            ` : ''}
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

        // Back button functionality
        document.querySelector('.mobile-back-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.goBackToConversations();
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

            // Stop any existing polling
            this.stopMessagePolling();

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

            // Set current conversation
            this.currentConversationId = conversationId;

            // Render chat area
            this.renderChatArea(conversation, participants);

            // Load messages
            await this.loadMessages(conversationId);

            // Start polling for this conversation
            this.startMessagePolling();

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
            if (!conversationId) {
                console.error('No conversation ID provided');
                return;
            }

            // Don't reload if we're already loading messages for this conversation
            if (this.isLoadingMessages) {
                console.log('Already loading messages, skipping...');
                return;
            }

            this.isLoadingMessages = true;

            // Check cache first
            const cacheKey = `messages_${conversationId}`;
            const cachedData = this.messageCache.get(cacheKey);
            const now = Date.now();

            // Use cache if available and less than 30 seconds old
            if (cachedData && (now - cachedData.timestamp) < 30000) {
                console.log('Using cached messages');
                this.renderMessages(cachedData.messages);
                this.isLoadingMessages = false;
                return;
            }

            // Show loading state only on first load
            if (!this.lastMessageCount) {
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    chatMessages.innerHTML = `
                        <div class="loading-messages">
                            <div class="loading-spinner"></div>
                            <p>Berichten laden...</p>
                        </div>
                    `;
                }
            }

            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Update cache
            this.messageCache.set(cacheKey, {
                messages: data.messages,
                timestamp: now
            });

            // Update tracking variables
            this.lastMessageCount = data.messages.length;
            this.lastMessageTimestamp = data.messages.length > 0 ? 
                data.messages[data.messages.length - 1].created_at : null;

            // Only update UI if messages have changed
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                const wasAtBottom = this.isScrolledToBottom(messagesContainer);
                this.renderMessages(data.messages);
                if (wasAtBottom) {
                    this.scrollToBottom(messagesContainer);
                }
            }

            // Mark messages as read
            await this.markVisibleMessagesAsRead();

        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Er is een fout opgetreden bij het laden van berichten.', 'danger');
        } finally {
            this.isLoadingMessages = false;
        }
    }

    isScrolledToBottom(element) {
        return Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
    }

    renderMessages(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="no-messages text-center p-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen berichten</h5>
                    <p class="text-muted">Begin een gesprek door een bericht te sturen</p>
                </div>
            `;
            return;
        }

        // Group messages by date and sender
        const messagesByDate = {};
        let currentDate = '';
        
        messages.forEach(message => {
            const messageDate = new Date(message.created_at).toLocaleDateString('nl-NL');
            
            if (!messagesByDate[messageDate]) {
                messagesByDate[messageDate] = [];
            }
            
            messagesByDate[messageDate].push(message);
        });

        let messagesHTML = '';
        
        // Render messages grouped by date
        Object.entries(messagesByDate).forEach(([date, dateMessages]) => {
            // Add date separator
            messagesHTML += `
                <div class="message-date-separator">
                    <span>${date}</span>
                </div>
            `;

            // Group messages by sender
            let currentSender = null;
            let messageGroup = [];

            dateMessages.forEach((message, index) => {
                if (currentSender !== message.sender_id) {
                    // Render previous group if exists
                    if (messageGroup.length > 0) {
                        messagesHTML += this.renderMessageGroup(messageGroup);
                    }
                    
                    // Start new group
                    messageGroup = [message];
                    currentSender = message.sender_id;
                } else {
                    // Add to current group
                    messageGroup.push(message);
                }

                // Render last group
                if (index === dateMessages.length - 1) {
                    messagesHTML += this.renderMessageGroup(messageGroup);
                }
            });
        });

        chatMessages.innerHTML = messagesHTML;
    }

    renderMessageGroup(messages) {
        if (!messages || messages.length === 0) return '';

        const isCurrentUser = messages[0].sender_id === this.currentUser.id;
        const messageAlignment = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
        const messageStyle = isCurrentUser ? 'sent' : 'received';
        
        return `
            <div class="message-group ${messageAlignment}">
                <div class="message-bubble-group">
                    ${messages.map(message => `
                        <div class="message-bubble ${messageStyle}">
                            ${this.formatMessageContent(message.content)}
                            <div class="message-meta">
                                <span class="message-time">${this.formatMessageTime(message.created_at)}</span>
                                ${message.is_edited ? '<span class="message-edited">(bewerkt)</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${!isCurrentUser ? `
                    <div class="message-sender">
                        ${messages[0].sender_first_name}
                    </div>
                ` : ''}
            </div>
        `;
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
        this.stopMessagePolling();
        
        // Only start polling if we have a conversation selected
        if (!this.currentConversationId) {
            console.log('No conversation selected, not starting polling');
            return;
        }
        
        console.log('Starting message polling for conversation:', this.currentConversationId);
        
        // Initialize tracking variables
        this.lastMessageCount = 0;
        this.lastMessageTimestamp = null;
        this.isLoadingMessages = false;
        
        // Poll for new messages every 30 seconds
        this.messagePollingInterval = setInterval(async () => {
            if (!this.currentConversationId || this.isLoadingMessages) {
                return;
            }

            try {
                const response = await fetch(`/api/conversations/${this.currentConversationId}/messages/check`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Only reload if there are new messages
                if (data.messageCount !== this.lastMessageCount || 
                    data.lastMessageTimestamp !== this.lastMessageTimestamp) {
                    console.log('New messages detected, reloading...');
                    await this.loadMessages(this.currentConversationId);
                }
            } catch (error) {
                console.error('Error checking messages:', error);
            }
        }, 30000); // Check every 30 seconds
    }

    stopMessagePolling() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
        this.messageCache.clear(); // Clear message cache when stopping polling
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

    goBackToConversations() {
        // Stop message polling when going back
        this.stopMessagePolling();
        
        // Hide active chat
        document.getElementById('active-chat').classList.add('d-none');
        // Show no chat selected message
        document.getElementById('no-chat-selected').classList.remove('d-none');
        // Clear current conversation
        this.currentConversationId = null;
        // Clear selected conversation highlight
        const conversationElements = document.querySelectorAll('.conversation-item');
        conversationElements.forEach(el => el.classList.remove('active'));
        // Show conversations list on mobile
        document.getElementById('conversations-sidebar').classList.add('show');
    }
}

// Initialize the messaging manager
const messagingManager = new MessagingManager();

document.addEventListener('DOMContentLoaded', async () => {
    await messagingManager.init();
}); 