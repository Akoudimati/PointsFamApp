class SimpleFamilyMessaging {
    constructor() {
        this.currentUser = null;
        this.familyMembers = [];
        this.currentChatUser = null;
        this.messages = [];
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Simple Family Messaging');
        
        try {
            // Get current user
            await this.getCurrentUser();
            
            // Load family members
            await this.loadFamilyMembers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Simple messaging initialized');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showAlert('danger', 'Kon berichten niet laden');
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to get user');
            }
            
            const data = await response.json();
            this.currentUser = data.user;
            
            // Update UI
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
            }
            
            console.log('👤 Current user:', this.currentUser.first_name, this.currentUser.role);
            
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async loadFamilyMembers() {
        try {
            const response = await fetch('/api/family/members', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load family members');
            }
            
            const data = await response.json();
            this.familyMembers = data.members.filter(member => member.id !== this.currentUser.id);
            
            this.renderFamilyMembers();
            
            console.log('👨‍👩‍👧‍👦 Loaded family members:', this.familyMembers.length);
            
        } catch (error) {
            console.error('Error loading family members:', error);
            this.showFamilyMembersError();
        }
    }

    renderFamilyMembers() {
        const container = document.getElementById('family-members-list');
        if (!container) return;
        
        if (this.familyMembers.length === 0) {
            container.innerHTML = `
                <div class="no-family-members text-center p-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Geen familie leden</h5>
                    <p class="text-muted">Er zijn geen andere familie leden om mee te chatten</p>
                </div>
            `;
            return;
        }

        const membersHTML = this.familyMembers.map(member => {
            const isChild = member.role === 'child';
            const isParent = member.role === 'parent';
            
            return `
                <div class="family-member-item" data-user-id="${member.id}" onclick="simpleMessaging.selectFamilyMember(${member.id})">
                    <div class="d-flex align-items-center">
                        <div class="member-avatar me-3" style="background-color: ${this.getAvatarColor(member.first_name)}">
                            ${member.first_name.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-grow-1">
                            <div class="member-name">${this.escapeHtml(member.first_name)} ${this.escapeHtml(member.last_name)}</div>
                            <div class="member-role">
                                <i class="fas fa-${isChild ? 'child' : 'user'} me-1"></i>
                                ${isChild ? 'Kind' : 'Ouder'}
                            </div>
                        </div>
                        <div class="member-status">
                            <i class="fas fa-circle text-success" title="Online"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = membersHTML;
    }

    selectFamilyMember(userId) {
        const member = this.familyMembers.find(m => m.id === userId);
        if (!member) return;
        
        console.log('💬 Starting chat with:', member.first_name);
        
        this.currentChatUser = member;
        this.showChatArea();
        this.loadMessages();
        
        // Update selected state
        document.querySelectorAll('.family-member-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-user-id="${userId}"]`).classList.add('active');
    }

    showChatArea() {
        const noChatSelected = document.getElementById('no-chat-selected');
        const activeChat = document.getElementById('active-chat');
        
        if (noChatSelected) noChatSelected.classList.add('d-none');
        if (activeChat) activeChat.classList.remove('d-none');
        
        // Update chat header
        const chatTitle = document.getElementById('chat-title');
        const chatStatus = document.getElementById('chat-status');
        const chatAvatar = document.getElementById('chat-avatar');
        
        if (chatTitle) {
            chatTitle.textContent = `${this.currentChatUser.first_name} ${this.currentChatUser.last_name}`;
        }
        
        if (chatStatus) {
            chatStatus.textContent = this.currentChatUser.role === 'child' ? 'Kind' : 'Ouder';
        }
        
        if (chatAvatar) {
            chatAvatar.innerHTML = `
                <div class="chat-avatar-circle" style="background-color: ${this.getAvatarColor(this.currentChatUser.first_name)}">
                    ${this.currentChatUser.first_name.charAt(0).toUpperCase()}
                </div>
            `;
        }
    }

    async loadMessages() {
        if (this.isLoading || !this.currentChatUser) return;
        
        this.isLoading = true;
        
        try {
            const response = await fetch(`/api/messages/direct/${this.currentChatUser.id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }
            
            const data = await response.json();
            this.messages = data.messages || [];
            
            this.renderMessages();
            
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showMessagesError();
        } finally {
            this.isLoading = false;
        }
    }

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="no-messages text-center p-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Nog geen berichten</h5>
                    <p class="text-muted">Start een gesprek door een bericht te sturen</p>
                </div>
            `;
            return;
        }

        const messagesHTML = this.messages.map(message => {
            const isOwn = message.sender_id === this.currentUser.id;
            const time = this.formatTime(message.created_at);
            
            return `
                <div class="message-wrapper ${isOwn ? 'own-message' : 'received-message'}">
                    <div class="message-bubble">
                        <div class="message-content">${this.escapeHtml(message.content)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = messagesHTML;
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content || !this.currentChatUser) return;
        
        try {
            const response = await fetch('/api/messages/direct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    recipient_id: this.currentChatUser.id,
                    content: content
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const data = await response.json();
            
            if (data.success) {
                input.value = '';
                await this.loadMessages(); // Reload messages
                console.log('✅ Message sent successfully');
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showAlert('danger', 'Kon bericht niet versturen');
        }
    }

    setupEventListeners() {
        // Message form
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendMessage();
            });
        }

        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            messageInput.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
            });
        }

        // Add chat button - show modal to select family member
        const addChatBtn = document.getElementById('add-chat-btn');
        if (addChatBtn) {
            addChatBtn.addEventListener('click', () => {
                this.showAddChatModal();
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
    }

    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.href = '/login.html';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login.html';
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${this.escapeHtml(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHTML;
        
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) alert.remove();
        }, 5000);
    }

    showFamilyMembersError() {
        const container = document.getElementById('family-members-list');
        if (container) {
            container.innerHTML = `
                <div class="error-state text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-muted">Fout bij laden</h5>
                    <p class="text-muted">Kon familie leden niet laden</p>
                    <button class="btn btn-primary btn-sm" onclick="simpleMessaging.loadFamilyMembers()">
                        <i class="fas fa-refresh me-1"></i>Probeer opnieuw
                    </button>
                </div>
            `;
        }
    }

    showMessagesError() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="error-state text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-muted">Fout bij laden</h5>
                    <p class="text-muted">Kon berichten niet laden</p>
                    <button class="btn btn-primary btn-sm" onclick="simpleMessaging.loadMessages()">
                        <i class="fas fa-refresh me-1"></i>Probeer opnieuw
                    </button>
                </div>
            `;
        }
    }

    getAvatarColor(name) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(dateString) {
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
        } else {
            return date.toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    showAddChatModal() {
        const modal = document.getElementById('addChatModal');
        const modalFamilyMembers = document.getElementById('modal-family-members');
        
        if (!modal || !modalFamilyMembers) return;
        
        // Clear previous content
        modalFamilyMembers.innerHTML = '';
        
        if (this.familyMembers.length === 0) {
            modalFamilyMembers.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Family Members</h5>
                    <p class="text-muted">There are no other family members to chat with</p>
                </div>
            `;
        } else {
            // Create clickable list of family members
            const membersHTML = this.familyMembers.map(member => {
                const isChild = member.role === 'child';
                return `
                    <button type="button" class="list-group-item list-group-item-action" 
                            onclick="simpleMessaging.startChatWithMember(${member.id})">
                        <div class="d-flex align-items-center">
                            <div class="member-avatar me-3" style="background-color: ${this.getAvatarColor(member.first_name)}">
                                ${member.first_name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-grow-1">
                                <div class="member-name fw-bold">${this.escapeHtml(member.first_name)} ${this.escapeHtml(member.last_name)}</div>
                                <div class="member-role text-muted">
                                    <i class="fas fa-${isChild ? 'child' : 'user'} me-1"></i>
                                    ${isChild ? 'Kind' : 'Ouder'}
                                </div>
                            </div>
                            <div class="member-action">
                                <i class="fas fa-comment text-primary"></i>
                            </div>
                        </div>
                    </button>
                `;
            }).join('');
            
            modalFamilyMembers.innerHTML = membersHTML;
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    startChatWithMember(memberId) {
        // Close the modal
        const modal = document.getElementById('addChatModal');
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
        
        // Start chat with the selected member
        this.selectFamilyMember(memberId);
        
        // Show success message
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            this.showAlert('success', `Started chat with ${member.first_name} ${member.last_name}`);
        }
    }
}

// Initialize when page loads
let simpleMessaging;
document.addEventListener('DOMContentLoaded', () => {
    simpleMessaging = new SimpleFamilyMessaging();
}); 