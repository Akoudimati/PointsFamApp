// PointsFam - Messaging JavaScript

class MessagingManager {
    constructor() {
        this.currentConversationId = null;
        this.currentUser = null;
        this.currentUserId = null;
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
        this.replyToMessageId = null;
        this.pollingInterval = null;
    }

    async init() {
        try {
            console.log('Initializing messaging manager...');
            
            // Get current user info
            const userResponse = await fetch('/api/user', {
                credentials: 'include'
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }
            
            const userData = await userResponse.json();
            this.currentUser = userData.user;
            this.currentUserId = userData.user.id;
            
            console.log('Current user:', this.currentUser);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Only load conversations if we're on the messages page
            if (window.location.pathname.includes('messages')) {
                await this.loadConversations();
            }
            
        } catch (error) {
            console.error('Error initializing messaging manager:', error);
            throw error;
        }
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
            if (!conversationsList) {
                console.error('conversations-list element not found');
                return [];
            }

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
                    return [];
                }
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Family conversations response:', data);
            
            // Store conversations
            this.conversations = data.conversations || [];
            console.log('Stored conversations:', this.conversations.length, this.conversations);
            
            // Clear loading state
            conversationsList.innerHTML = '';
            
            // Render conversations
            this.renderConversations();
            
            // Load family members after conversations
            await this.loadFamilyMembers();
            
            // Return conversations for use in dashboard
            return this.conversations;
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showNotification(`Er is een fout opgetreden bij het laden van gesprekken: ${error.message}`, 'danger');
            this.renderConversationsError();
            return [];
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
        if (!conversationsList) {
            console.error('conversations-list element not found in renderConversations');
            return;
        }
        
        console.log('Rendering conversations:', this.conversations.length);
        
        if (!this.conversations || this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="no-conversations text-center p-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen gesprekken</h5>
                    <p class="text-muted">Start een gesprek om te beginnen</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#newChatModal">
                        <i class="fas fa-plus me-1"></i>
                        Nieuw gesprek
                    </button>
                </div>
            `;
            return;
        }

        // Create conversation items with better structure
        const conversationsHTML = this.conversations.map(conversation => {
            const conversationId = conversation.id;
            const title = conversation.title || this.getConversationTitle(conversation);
            const lastMessage = conversation.last_message_content || 'Nog geen berichten';
            const timeAgo = this.formatTimeAgo(conversation.last_message_at || conversation.created_at);
            const unreadCount = conversation.unread_count || 0;
            const typeBadge = this.getConversationTypeBadge(conversation.type);
            
            // Get participants for display
            const participants = this.getConversationParticipants(conversation);
            const participantText = participants.length > 0 ? participants.join(', ') : 'Geen deelnemers';
            
            return `
                <div class="conversation-item" 
                     data-conversation-id="${conversationId}" 
                     onclick="messagingManager.selectConversation('${conversationId}')">
                    <div class="d-flex align-items-start">
                        <div class="conversation-avatar me-3">
                            <div class="avatar-circle" style="background-color: ${this.getAvatarColor(title)}">
                                ${this.getConversationIcon(conversation.type)}
                            </div>
                        </div>
                        <div class="conversation-details flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h6 class="conversation-title mb-0">${this.escapeHtml(title)}</h6>
                                <small class="conversation-time text-muted">${timeAgo}</small>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="conversation-type-badge ${conversation.type}-badge">${typeBadge}</span>
                                ${unreadCount > 0 ? `<span class="badge bg-primary rounded-pill">${unreadCount}</span>` : ''}
                            </div>
                            <p class="conversation-preview text-muted mb-1">${this.escapeHtml(lastMessage)}</p>
                            <small class="conversation-participants text-muted">
                                <i class="fas fa-users me-1"></i>${this.escapeHtml(participantText)}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        conversationsList.innerHTML = conversationsHTML;
        
        console.log('✅ Conversations rendered successfully');
    }

    getConversationParticipants(conversation) {
        // Return participant names based on conversation type
        if (conversation.type === 'family') {
            return this.familyMembers ? this.familyMembers.map(m => m.first_name) : ['Familie'];
        } else if (conversation.type === 'direct') {
            // For direct messages, show the other person's name
            return [conversation.title || 'Direct gesprek'];
        } else {
            // For group chats, show participant count or names
            return [conversation.title || 'Groepsgesprek'];
        }
    }

    getConversationIcon(type) {
        switch (type) {
            case 'family': return '<i class="fas fa-home"></i>';
            case 'direct': return '<i class="fas fa-user"></i>';
            case 'group': return '<i class="fas fa-users"></i>';
            default: return '<i class="fas fa-comments"></i>';
        }
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
        // Message form submission
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendMessage();
            });
        }

        // Message input auto-resize
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            });

            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Conversation selection - using event delegation
        const conversationsList = document.getElementById('conversations-list');
        if (conversationsList) {
            conversationsList.addEventListener('click', (e) => {
                const conversationItem = e.target.closest('.conversation-item');
                if (conversationItem) {
                    const conversationId = conversationItem.dataset.conversationId;
                    console.log('🎯 Conversation clicked:', conversationId);
                    if (conversationId) {
                        this.selectConversation(conversationId);
                    }
                }
            });
        }

        // New chat form
        const newChatForm = document.getElementById('new-chat-form');
        if (newChatForm) {
            newChatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createNewChat();
            });
        }

        // Chat type selection
        const chatTypeSelect = document.getElementById('chat-type');
        if (chatTypeSelect) {
            chatTypeSelect.addEventListener('change', (e) => {
                this.updateNewChatForm(e.target.value);
            });
        }

        // User search
        const userSearchInput = document.getElementById('user-search');
        if (userSearchInput) {
            let searchTimeout;
            userSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleUserSearch(e.target.value);
                }, 300);
            });
        }

        // Delete conversation
        const deleteConversationBtn = document.getElementById('delete-conversation');
        if (deleteConversationBtn) {
            deleteConversationBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.deleteConversation();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // Mobile responsive
        const mobileToggle = document.getElementById('mobile-conversations-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileConversations();
            });
        }

        const mobileBack = document.getElementById('mobile-back-button');
        if (mobileBack) {
            mobileBack.addEventListener('click', () => {
                this.goBackToConversations();
            });
        }
    }

    async selectConversation(conversationId) {
        try {
            console.log('Selecting conversation:', conversationId);
            
            if (!conversationId) {
                console.error('Invalid conversation ID');
                return;
            }
            
            // Convert to string to ensure consistency
            conversationId = String(conversationId);
            this.currentConversationId = conversationId;
            
            // Stop any existing polling
            this.stopPolling();

            // Get conversation details 
            const conversation = this.conversations.find(c => String(c.id) === conversationId);
            if (!conversation) {
                console.error('Conversation not found:', conversationId);
                return;
            }

            console.log('Loading conversation:', conversation);

            // Show loading state
            const conversationDetail = document.getElementById('conversation-detail');
            conversationDetail.innerHTML = `
                <div class="loading-conversation d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" role="status"></div>
                        <p class="text-muted">Gesprek laden...</p>
                    </div>
                </div>
            `;

            // Load participants (from family members)
            const participants = this.familyMembers || [];
            
            // Show the conversation details
            conversationDetail.classList.remove('d-none');
            
            // Render chat area
            this.renderChatArea(conversation, participants);
            
            // Load messages with the correct conversation ID
            await this.loadMessages(conversationId);

            // Start polling for this conversation
            this.startPolling();

            // Update UI state
            this.updateSelectedConversation(conversationId);

        } catch (error) {
            console.error('Error selecting conversation:', error);
            this.showNotification('Er is een fout opgetreden bij het laden van het gesprek.', 'danger');
        }
    }

    renderChatArea(conversation, participants) {
        console.log('🎨 Rendering chat area for:', conversation.title);
        
        const chatArea = document.getElementById('active-chat');
        const noChatSelected = document.getElementById('no-chat-selected');
        
        if (!chatArea || !noChatSelected) {
            console.error('Chat area elements not found');
            return;
        }

        // Hide "no chat selected" and show active chat
        noChatSelected.classList.add('d-none');
        chatArea.classList.remove('d-none');

        // Update chat header
        const chatTitle = document.getElementById('chat-title');
        const chatParticipants = document.getElementById('chat-participants');
        
        if (chatTitle) {
            chatTitle.innerHTML = `
                <i class="${this.getConversationIcon(conversation.type).replace('<i class="', '').replace('"></i>', '')} me-2"></i>
                ${this.escapeHtml(conversation.title || 'Gesprek')}
            `;
        }
        
        if (chatParticipants) {
            const participantNames = this.getConversationParticipants(conversation);
            chatParticipants.textContent = participantNames.join(', ');
        }

        // Clear messages container
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="loading-messages text-center p-4">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Berichten laden...</span>
                    </div>
                    <p class="mt-2 text-muted">Berichten laden...</p>
                </div>
            `;
        }

        console.log('✅ Chat area rendered successfully');
    }

    async loadMessages(conversationId) {
        try {
            if (!conversationId) {
                console.error('No conversation ID provided');
                return;
            }

            // Don't reload if we're already loading messages for this conversation
            if (this.isLoadingMessages) {
                return;
            }

            this.isLoadingMessages = true;
            console.log('Loading messages for conversation:', conversationId);

            // Show minimal loading state
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages && chatMessages.children.length === 0) {
                chatMessages.innerHTML = `
                    <div class="loading-messages text-center p-2">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Laden...</span>
                        </div>
                    </div>
                `;
            }

            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Store messages for this conversation
            this.currentMessages = data.messages || [];
            
            // Render messages immediately (much faster now!)
            this.renderMessages(this.currentMessages);
            
            console.log(`✅ Loaded ${this.currentMessages.length} messages instantly!`);
            
        } catch (error) {
            console.error('Error loading messages:', error);
            
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="error-state text-center p-4">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle"></i>
                            <p class="mb-2">Kon berichten niet laden</p>
                            <button class="btn btn-sm btn-outline-primary" onclick="messagingManager.loadMessages('${conversationId}')">
                                <i class="bi bi-arrow-clockwise"></i> Opnieuw proberen
                            </button>
                        </div>
                    </div>
                `;
            }
        } finally {
            this.isLoadingMessages = false;
        }
    }

    isScrolledToBottom(element) {
        return Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
    }

    renderMessages(messages) {
        // Try to find the messages container
        let messagesContainer = document.getElementById('chat-messages');
        
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }

        console.log('Rendering messages:', messages.length, 'Current user ID:', this.currentUserId);

        if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages text-center p-4">
                    <div class="mb-3">
                        <i class="bi bi-chat-dots" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5 class="text-muted mb-2">Nog geen berichten</h5>
                    <p class="text-muted">Start het gesprek door een bericht te sturen!</p>
                </div>
            `;
            return;
        }

        // Simple message rendering without complex grouping
        let messagesHTML = '';
        
        messages.forEach(message => {
            const isCurrentUser = message.sender_id === this.currentUserId;
            const messageTime = this.formatTime(message.created_at);
            
            messagesHTML += `
                <div class="message-wrapper mb-3 ${isCurrentUser ? 'text-end' : 'text-start'}">
                    <div class="message-bubble ${isCurrentUser ? 'message-sent' : 'message-received'} d-inline-block">
                        <div class="message-content">${this.escapeHtml(message.content)}</div>
                        <div class="message-time">${messageTime}</div>
                        ${!isCurrentUser ? `<div class="message-sender">${this.escapeHtml(message.sender_first_name)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        messagesContainer.innerHTML = messagesHTML;
        
        // Auto-scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
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
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentConversationId) {
            return;
        }

        // Clear input immediately for better UX
        messageInput.value = '';
        
        try {
            // Create optimistic message for instant display
            const optimisticMessage = {
                id: 'temp_' + Date.now(),
                sender_id: this.currentUser.id,
                sender_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
                sender_first_name: this.currentUser.first_name,
                content: content,
                created_at: new Date().toISOString(),
                sending: true // Flag to show sending state
            };

            // Add to current messages and render immediately
            this.currentMessages.push(optimisticMessage);
            this.renderMessages(this.currentMessages);
            this.scrollToBottom();

            // Send to server
            const response = await fetch(`/api/conversations/${this.currentConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Replace optimistic message with real message
                const index = this.currentMessages.findIndex(m => m.id === optimisticMessage.id);
                if (index !== -1) {
                    this.currentMessages[index] = data.message;
                    this.renderMessages(this.currentMessages);
                }
                
                console.log('✅ Message sent instantly!');
            } else {
                throw new Error(data.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remove failed optimistic message
            this.currentMessages = this.currentMessages.filter(m => m.id !== optimisticMessage.id);
            this.renderMessages(this.currentMessages);
            
            // Restore message to input
            messageInput.value = content;
            
            this.showNotification('Kon bericht niet verzenden. Probeer opnieuw.', 'danger');
        }
    }

    updateNewChatForm(chatType) {
        console.log('🔄 Updating new chat form for type:', chatType);
        
        const titleGroup = document.getElementById('chat-title-group');
        const userSearchGroup = document.getElementById('user-search-group');
        const selectedUsersGroup = document.getElementById('selected-users-group');
        const userSearchInput = document.getElementById('user-search');
        const newChatTitle = document.getElementById('new-chat-title');
        
        // Reset form
        if (userSearchInput) userSearchInput.value = '';
        if (newChatTitle) newChatTitle.value = '';
        this.selectedUsers = [];
        this.renderSelectedUsers();
        
        switch (chatType) {
            case 'direct':
                // Personal chat - show user search, hide title
                if (titleGroup) titleGroup.style.display = 'none';
                if (userSearchGroup) userSearchGroup.style.display = 'block';
                if (selectedUsersGroup) selectedUsersGroup.style.display = 'block';
                if (userSearchInput) {
                    userSearchInput.placeholder = 'Zoek een familielid om mee te chatten...';
                }
                break;
                
            case 'group':
                // Group chat - show both title and user search
                if (titleGroup) titleGroup.style.display = 'block';
                if (userSearchGroup) userSearchGroup.style.display = 'block';
                if (selectedUsersGroup) selectedUsersGroup.style.display = 'block';
                if (userSearchInput) {
                    userSearchInput.placeholder = 'Zoek familieleden voor de groep...';
                }
                if (newChatTitle) {
                    newChatTitle.placeholder = 'Bijv. "Huiswerk Groep"';
                }
                break;
                
            case 'family':
                // Family chat - only show title, no user search needed
                if (titleGroup) titleGroup.style.display = 'block';
                if (userSearchGroup) userSearchGroup.style.display = 'none';
                if (selectedUsersGroup) selectedUsersGroup.style.display = 'none';
                if (newChatTitle) {
                    newChatTitle.placeholder = 'Bijv. "Familie Planning"';
                }
                break;
        }
        
        console.log('✅ Chat form updated for type:', chatType);
    }

    async handleUserSearch(query) {
        if (!query || query.length < 2) {
            this.hideUserSearchResults();
            return;
        }
        
        console.log('🔍 Searching for users:', query);
        
        try {
            const users = await this.searchUsers(query);
            this.renderUserSearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
            this.hideUserSearchResults();
        }
    }

    async searchUsers(query) {
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('👥 Found users:', data.users.length);
            return data.users || [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    renderUserSearchResults(users) {
        const dropdown = document.getElementById('user-search-dropdown');
        if (!dropdown) return;
        
        if (!users || users.length === 0) {
            dropdown.innerHTML = `
                <div class="p-3 text-muted text-center">
                    <i class="fas fa-search me-2"></i>
                    Geen gebruikers gevonden
                </div>
            `;
            dropdown.classList.remove('d-none');
            return;
        }
        
        const resultsHTML = users.map(user => {
            const isSelected = this.selectedUsers.some(u => u.id === user.id);
            const isCurrentUser = user.id === this.currentUserId;
            
            if (isCurrentUser) return ''; // Don't show current user
            
            return `
                <div class="user-search-result ${isSelected ? 'selected' : ''}" 
                     data-user-id="${user.id}" 
                     onclick="messagingManager.toggleUserSelection(${user.id}, '${this.escapeHtml(user.first_name)}', '${this.escapeHtml(user.last_name)}', '${user.role}')">
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2" style="background-color: ${this.getAvatarColor(user.first_name)}">
                            ${user.first_name.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-grow-1">
                            <div class="user-name">${this.escapeHtml(user.first_name)} ${this.escapeHtml(user.last_name)}</div>
                            <div class="user-role">${user.role === 'parent' ? 'Ouder' : 'Kind'}</div>
                        </div>
                        ${isSelected ? '<i class="fas fa-check text-success"></i>' : ''}
                    </div>
                </div>
            `;
        }).filter(html => html).join('');
        
        dropdown.innerHTML = resultsHTML;
        dropdown.classList.remove('d-none');
    }

    toggleUserSelection(userId, firstName, lastName, role) {
        const existingIndex = this.selectedUsers.findIndex(u => u.id === userId);
        
        if (existingIndex !== -1) {
            // Remove user
            this.selectedUsers.splice(existingIndex, 1);
            console.log('➖ Removed user:', firstName);
        } else {
            // Add user
            this.selectedUsers.push({
                id: userId,
                first_name: firstName,
                last_name: lastName,
                role: role
            });
            console.log('➕ Added user:', firstName);
        }
        
        this.renderSelectedUsers();
        this.renderUserSearchResults(this.lastSearchResults || []);
    }

    renderSelectedUsers() {
        const container = document.getElementById('selected-users');
        if (!container) return;
        
        if (!this.selectedUsers || this.selectedUsers.length === 0) {
            container.innerHTML = `
                <div class="text-muted text-center p-3">
                    <i class="fas fa-users me-2"></i>
                    Geen gebruikers geselecteerd
                </div>
            `;
            return;
        }
        
        const usersHTML = this.selectedUsers.map(user => `
            <div class="selected-user-tag">
                <div class="d-flex align-items-center">
                    <div class="user-avatar-small me-2" style="background-color: ${this.getAvatarColor(user.first_name)}">
                        ${user.first_name.charAt(0).toUpperCase()}
                    </div>
                    <span>${this.escapeHtml(user.first_name)} ${this.escapeHtml(user.last_name)}</span>
                    <button type="button" class="btn-close btn-close-sm ms-2" 
                            onclick="messagingManager.toggleUserSelection(${user.id}, '${this.escapeHtml(user.first_name)}', '${this.escapeHtml(user.last_name)}', '${user.role}')">
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = usersHTML;
    }

    hideUserSearchResults() {
        const dropdown = document.getElementById('user-search-dropdown');
        if (dropdown) {
            dropdown.classList.add('d-none');
        }
    }

    async createNewChat() {
        const chatType = document.getElementById('chat-type').value;
        const chatTitle = document.getElementById('new-chat-title').value.trim();
        
        console.log('🚀 Creating new chat:', { chatType, chatTitle, selectedUsers: this.selectedUsers });
        
        try {
            let conversationData = {
                type: chatType
            };
            
            switch (chatType) {
                case 'direct':
                    if (this.selectedUsers.length !== 1) {
                        throw new Error('Selecteer precies één persoon voor een direct gesprek');
                    }
                    conversationData.title = `${this.selectedUsers[0].first_name} ${this.selectedUsers[0].last_name}`;
                    conversationData.participants = [this.selectedUsers[0].id];
                    break;
                    
                case 'group':
                    if (!chatTitle) {
                        throw new Error('Voer een titel in voor het groepsgesprek');
                    }
                    if (this.selectedUsers.length < 1) {
                        throw new Error('Selecteer minimaal één persoon voor een groepsgesprek');
                    }
                    conversationData.title = chatTitle;
                    conversationData.participants = this.selectedUsers.map(u => u.id);
                    break;
                    
                case 'family':
                    if (!chatTitle) {
                        throw new Error('Voer een titel in voor het familie gesprek');
                    }
                    conversationData.title = chatTitle;
                    conversationData.is_family_chat = true;
                    break;
                    
                default:
                    throw new Error('Ongeldig gesprekstype');
            }
            
            console.log('📤 Sending conversation data:', conversationData);
            
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversationData),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Fout bij het maken van gesprek');
            }
            
            const result = await response.json();
            console.log('✅ Conversation created:', result);
            
            // Close modal
            const modal = document.getElementById('newChatModal');
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
            
            // Refresh conversations
            await this.loadConversations();
            
            // Select the new conversation
            if (result.conversation && result.conversation.id) {
                this.selectConversation(result.conversation.id);
            }
            
            this.showAlert('success', 'Gesprek succesvol aangemaakt!');
            
        } catch (error) {
            console.error('❌ Error creating conversation:', error);
            this.showAlert('danger', error.message || 'Fout bij het maken van gesprek');
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${this.escapeHtml(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHTML;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    formatTimeAgo(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Nu';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m geleden`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}u geleden`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d geleden`;
        } else {
            return date.toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'short' 
            });
        }
    }

    getConversationTypeBadge(type) {
        switch (type) {
            case 'family': return 'Familie';
            case 'direct': return 'Direct';
            case 'group': return 'Groep';
            default: return 'Gesprek';
        }
    }

    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Much faster polling since we're using in-memory storage (every 2 seconds instead of 60)
        this.pollingInterval = setInterval(() => {
            if (this.currentConversationId && !this.isLoadingMessages) {
                this.loadMessages(this.currentConversationId);
            }
        }, 2000); // 2 seconds - much faster!
        
        console.log('🚀 Started fast polling every 2 seconds');
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ Stopped polling');
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.stopPolling();
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getAvatarColor(name) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    goBackToConversations() {
        const chatArea = document.getElementById('active-chat');
        const noChatSelected = document.getElementById('no-chat-selected');
        const sidebar = document.getElementById('conversations-sidebar');
        
        if (chatArea) chatArea.classList.add('d-none');
        if (noChatSelected) noChatSelected.classList.remove('d-none');
        if (sidebar) sidebar.classList.add('show');
        
        // Stop polling
        this.stopPolling();
        this.currentConversationId = null;
    }

    clearReplyState() {
        // Implementation of clearReplyState method
    }

    async deleteConversation() {
        if (!this.currentConversation || !this.currentConversationId) {
            this.showNotification('Geen gesprek geselecteerd om te verwijderen.', 'warning');
            return;
        }

        // Show confirmation dialog
        const confirmDelete = confirm(
            `Weet je zeker dat je het gesprek "${this.currentConversation.title || 'Onbekend'}" wilt verwijderen?\n\n` +
            'Dit kan niet ongedaan gemaakt worden en alle berichten zullen verloren gaan.'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(`/api/conversations/${this.currentConversationId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Gesprek succesvol verwijderd.', 'success');
                
                // Reset chat area
                document.getElementById('active-chat').classList.add('d-none');
                document.getElementById('no-chat-selected').classList.remove('d-none');
                
                // Clear current conversation
                this.currentConversationId = null;
                this.currentConversation = null;
                
                // Reload conversations list
                await this.loadConversations();
                
            } else {
                throw new Error(result.message || 'Fout bij verwijderen van gesprek');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            this.showNotification('Er is een fout opgetreden bij het verwijderen van het gesprek.', 'danger');
        }
    }

    updateSelectedConversation(conversationId) {
        const conversationElements = document.querySelectorAll('.conversation-item');
        conversationElements.forEach(el => {
            el.classList.remove('active');
            if (String(el.dataset.conversationId) === String(conversationId)) {
                el.classList.add('active');
            }
        });
    }

    toggleMobileConversations() {
        const sidebar = document.getElementById('conversations-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    }
}

// Initialize the messaging manager
const messagingManager = new MessagingManager();

document.addEventListener('DOMContentLoaded', async () => {
    await messagingManager.init();
}); 