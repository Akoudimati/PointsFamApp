// PointsFam - Dashboard JavaScript (Simplified)

class DashboardManager {
    constructor() {
        this.selectedChildId = 'all';
        this.allChildren = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            // Check if user is authenticated by checking session
            try {
                const userResponse = await fetch('/api/user', {
                    credentials: 'include' // Important for session cookies
                });
                
                if (!userResponse.ok) {
                    if (userResponse.status === 401) {
                        // Session expired, redirect to login
                        localStorage.removeItem('user');
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${userResponse.status}`);
                }
                
                const userData = await userResponse.json();
                
                // Store user data for quick access
                localStorage.setItem('user', JSON.stringify(userData.user));
                
                // Now fetch dashboard data
                const response = await fetch('/api/dashboard', {
                    credentials: 'include' // Important for session cookies
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('user');
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                window.dashboardData = data;
                
                // Populate dashboard with data
                this.populateDashboard(data, userData.user);
                
                if (userData.user.role === 'parent') {
                    this.setupChildSelection(data.family_members);
                }
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                this.showNotification('Er is een fout opgetreden bij het laden van het dashboard.', 'danger');
                
                // Only redirect to login if it's an authentication error
                if (error.message.includes('401') || error.message.includes('Authentication')) {
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                }
            }

            this.setupBasicFeatures();
            
            // Load recent messages after a short delay to ensure everything is ready
            setTimeout(() => {
                this.loadRecentMessages();
                
                // Set up auto-refresh for recent messages every 30 seconds
                setInterval(() => {
                    this.loadRecentMessages();
                }, 30000);
            }, 500);
        });
    }

    async loadRecentMessages() {
        try {
            // Load family conversations for recent messages
            const conversationsResponse = await fetch('/api/conversations?family_only=true', {
                credentials: 'include'
            });
            
            if (!conversationsResponse.ok) {
                throw new Error(`Failed to load conversations: ${conversationsResponse.status}`);
            }
            
            const conversationsData = await conversationsResponse.json();
            
            // Load unread messages count
            const unreadResponse = await fetch('/api/messages/unread-count', {
                credentials: 'include'
            });
            
            if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                this.updateUnreadCount(unreadData.unreadCount);
            }
            
            this.renderRecentMessages(conversationsData.conversations);
            
        } catch (error) {
            console.error('Error loading recent messages:', error);
            this.renderRecentMessagesError();
        }
    }

    updateUnreadCount(count) {
        const unreadCountElement = document.getElementById('unread-messages-count');
        const unreadBadge = document.getElementById('unread-messages-badge');
        
        if (unreadCountElement) {
            unreadCountElement.textContent = count;
        }
        
        if (unreadBadge) {
            if (count > 0) {
                unreadBadge.textContent = count;
                unreadBadge.classList.remove('d-none');
            } else {
                unreadBadge.classList.add('d-none');
            }
        }
    }

    renderRecentMessages(conversations) {
        const container = document.getElementById('recent-messages-container');
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = `
                <div class="no-messages-state">
                    <i class="fas fa-inbox"></i>
                    <h6>Nog geen berichten</h6>
                    <p>Start een gesprek met je familie of vrienden!</p>
                    <a href="/messages" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus me-1"></i>
                        Start een gesprek
                    </a>
                </div>
            `;
            return;
        }

        // Show only the 3 most recent conversations
        const recentConversations = conversations.slice(0, 3);
        
        const messagesHTML = recentConversations.map(conversation => {
            const title = conversation.title || this.getConversationTitle(conversation);
            const lastMessage = conversation.last_message_content || 'Nog geen berichten';
            const timeAgo = this.formatTimeAgo(conversation.last_message_at || conversation.created_at);
            const unreadCount = conversation.unread_count || 0;
            const hasUnread = unreadCount > 0;
            
            // Create avatar based on conversation type
            const avatarClass = this.getAvatarClass(conversation.type);
            const avatarText = this.getAvatarText(conversation);
            const typeBadge = this.getTypeBadge(conversation.type);
            
            return `
                <div class="chat-conversation ${hasUnread ? 'has-unread' : ''}" data-conversation-id="${conversation.id}">
                    <div class="chat-avatar ${avatarClass}">
                        ${avatarText}
                    </div>
                    <div class="chat-content">
                        <div class="chat-title">${this.escapeHtml(title)}</div>
                        <div class="chat-message">${this.escapeHtml(lastMessage)}</div>
                    </div>
                    <div class="chat-meta">
                        <div class="chat-time">${timeAgo}</div>
                        ${typeBadge}
                        ${hasUnread ? `<div class="chat-unread-badge">${unreadCount}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = messagesHTML + `
            <div class="recent-messages-footer">
                <a href="/messages" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-comments me-1"></i>
                    Alle berichten bekijken
                </a>
            </div>
        `;
        
        // Add click event listeners to conversation items
        container.querySelectorAll('.chat-conversation').forEach(item => {
            item.addEventListener('click', (e) => {
                const conversationId = item.dataset.conversationId;
                this.openConversation(conversationId);
            });
        });
    }

    getAvatarClass(type) {
        switch (type) {
            case 'family':
                return 'family';
            case 'group':
                return 'group';
            case 'direct':
                return 'direct';
            case 'cross_family':
                return 'group';
            default:
                return 'direct';
        }
    }

    getAvatarText(conversation) {
        if (conversation.title) {
            return conversation.title.charAt(0).toUpperCase();
        }
        
        switch (conversation.type) {
            case 'family':
                return 'F';
            case 'group':
                return 'G';
            case 'direct':
                return 'D';
            case 'cross_family':
                return 'C';
            default:
                return '?';
        }
    }

    getTypeBadge(type) {
        switch (type) {
            case 'family':
                return '<span class="chat-type-badge family">Familie</span>';
            case 'group':
                return '<span class="chat-type-badge group">Groep</span>';
            case 'direct':
                return '<span class="chat-type-badge direct">Direct</span>';
            case 'cross_family':
                return '<span class="chat-type-badge cross-family">Cross-Familie</span>';
            default:
                return '';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openConversation(conversationId) {
        // Navigate to messages page with specific conversation
        window.location.href = `/messages?conversation=${conversationId}`;
    }

    renderRecentMessagesError() {
        const container = document.getElementById('recent-messages-container');
        container.innerHTML = `
            <div class="error-messages">
                <i class="fas fa-exclamation-triangle"></i>
                <h6>Kon berichten niet laden</h6>
                <p>Er is een probleem opgetreden bij het laden van je berichten.</p>
                <button class="btn btn-outline-primary btn-sm" onclick="window.dashboardManager.loadRecentMessages()">
                    <i class="fas fa-redo me-1"></i>
                    Probeer opnieuw
                </button>
            </div>
        `;
    }

    getConversationTitle(conversation) {
        if (conversation.title) return conversation.title;
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        switch (conversation.type) {
            case 'family':
                return `${user.familyName || 'Familie'} Chat`;
            case 'group':
                return 'Groepsgesprek';
            case 'direct':
                return 'Direct bericht';
            default:
                return 'Gesprek';
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

    populateDashboard(data, user) {
        try {
            // Update user points
            const pointsElements = document.querySelectorAll('[data-user-points]');
            pointsElements.forEach(el => {
                el.textContent = user.points || 0;
            });

            // Update task counts
            const tasks = data.tasks || [];
            const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'approved');
            const pendingTasks = tasks.filter(task => task.status === 'pending');

            const completedElements = document.querySelectorAll('[data-completed-tasks]');
            completedElements.forEach(el => {
                el.textContent = completedTasks.length;
            });

            const pendingElements = document.querySelectorAll('[data-pending-tasks]');
            pendingElements.forEach(el => {
                el.textContent = pendingTasks.length;
            });

            // Populate task list
            this.populateTaskList(tasks);

            // Hide error messages if everything loaded successfully
            const errorAlerts = document.querySelectorAll('.alert-danger');
            errorAlerts.forEach(alert => {
                if (alert.textContent.includes('dashboard')) {
                    alert.remove();
                }
            });

            console.log('✅ Dashboard populated successfully');
        } catch (error) {
            console.error('Error populating dashboard:', error);
        }
    }

    populateTaskList(tasks) {
        const taskContainer = document.querySelector('[data-tasks-container]');
        if (!taskContainer) return;

        taskContainer.innerHTML = '';

        if (tasks.length === 0) {
            taskContainer.innerHTML = '<p class="text-muted">Geen taken beschikbaar.</p>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'card mb-3';
            taskElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">${task.name}</h5>
                            <p class="card-text text-muted">${task.description || ''}</p>
                            <span class="badge bg-info">${task.points} punten</span>
                        </div>
                        <div class="btn-group">
                            ${this.getTaskButtons(task)}
                        </div>
                    </div>
                </div>
            `;
            taskContainer.appendChild(taskElement);
        });
    }

    getTaskButtons(task) {
        const status = task.status || 'pending';
        
        switch (status) {
            case 'pending':
                return `
                    <button class="btn btn-success btn-sm" onclick="acceptTask(${task.assignment_id})">
                        <i class="fas fa-check"></i> Accepteren
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="declineTask(${task.assignment_id})">
                        <i class="fas fa-times"></i> Weigeren
                    </button>
                `;
            case 'accepted':
                return `
                    <button class="btn btn-primary btn-sm" onclick="completeTask(${task.assignment_id})">
                        <i class="fas fa-check-circle"></i> Voltooien
                    </button>
                `;
            case 'completed':
                return `
                    <span class="badge bg-warning">Wacht op goedkeuring</span>
                `;
            case 'approved':
                return `
                    <span class="badge bg-success">Goedgekeurd</span>
                `;
            case 'rejected':
                return `
                    <span class="badge bg-danger">Afgekeurd</span>
                `;
            default:
                return `
                    <button class="btn btn-success btn-sm" onclick="acceptTask(${task.assignment_id})">
                        <i class="fas fa-check"></i> Accepteren
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="declineTask(${task.assignment_id})">
                        <i class="fas fa-times"></i> Weigeren
                    </button>
                `;
        }
    }

    setupChildSelection(familyMembers) {
        this.allChildren = familyMembers.filter(member => member.role === 'child');
        
        if (this.allChildren.length > 0) {
            const childSelector = document.getElementById('child-selector');
            if (childSelector) {
                childSelector.classList.remove('d-none');
                this.populateChildDropdown();
                this.setupChildSelectionHandlers();
            }
        }
    }

    populateChildDropdown() {
        const dropdownMenu = document.getElementById('child-dropdown-menu');
        if (!dropdownMenu) return;
        
        const existingChildren = dropdownMenu.querySelectorAll('.child-option');
        existingChildren.forEach(child => child.remove());
        
        this.allChildren.forEach(child => {
            const childItem = document.createElement('li');
            childItem.className = 'child-option';
            childItem.innerHTML = `
                <a class="dropdown-item" href="#" data-child-id="${child.id}">
                    ${child.first_name} ${child.last_name}
                    <span class="badge bg-secondary ms-2">${child.points} punten</span>
                </a>
            `;
            dropdownMenu.appendChild(childItem);
        });
    }

    setupChildSelectionHandlers() {
        const dropdownItems = document.querySelectorAll('#child-dropdown-menu .dropdown-item');
        
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const childId = item.dataset.childId;
                this.selectedChildId = childId;
                
                const selectedChildSpan = document.getElementById('selected-child');
                if (selectedChildSpan) {
                    const childName = item.textContent.trim().split('\n')[0].trim();
                    selectedChildSpan.textContent = childName;
                }
                
                dropdownItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                this.filterDashboardData();
                
                const dropdownMenu = document.getElementById('child-dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }
            });
        });
    }

    filterDashboardData() {
        const selectedChild = this.selectedChildId === 'all' ? 
            'alle kinderen' : 
            this.allChildren.find(child => child.id.toString() === this.selectedChildId.toString())?.first_name || 'onbekend kind';
        
        this.showNotification(`Dashboard gefilterd voor: ${selectedChild}`, 'info');
        this.updateDashboardFilter(selectedChild);
    }

    updateDashboardFilter(selectedChild) {
        let filterIndicator = document.getElementById('filter-indicator');
        if (!filterIndicator) {
            filterIndicator = document.createElement('div');
            filterIndicator.id = 'filter-indicator';
            filterIndicator.className = 'alert alert-info';
            
            const alertContainer = document.getElementById('alert-container');
            if (alertContainer) {
                alertContainer.appendChild(filterIndicator);
            }
        }
        
        if (this.selectedChildId === 'all') {
            filterIndicator.style.display = 'none';
        } else {
            filterIndicator.style.display = 'block';
            filterIndicator.innerHTML = `
                Dashboard wordt getoond voor: <strong>${selectedChild}</strong>
                <button type="button" class="btn-close" onclick="this.parentElement.style.display='none'"></button>
            `;
        }
    }

    setupBasicFeatures() {
        // Setup basic dropdown functionality
        const dropdownToggleButtons = document.querySelectorAll('.dropdown-toggle');
        
        dropdownToggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const targetId = button.getAttribute('data-bs-target') || button.getAttribute('href');
                const targetMenu = document.querySelector(targetId);
                
                if (targetMenu) {
                    targetMenu.classList.toggle('show');
                    button.setAttribute('aria-expanded', targetMenu.classList.contains('show'));
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                openDropdowns.forEach(dropdown => {
                    dropdown.classList.remove('show');
                    const toggle = dropdown.previousElementSibling;
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        
        alertContainer.appendChild(alertElement);
        
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.parentNode.removeChild(alertElement);
            }
        }, duration);
    }

    static init() {
        window.dashboardManager = new DashboardManager();
        return window.dashboardManager;
    }
}

// Initialize messaging system
let messagingManager;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize messaging manager
    messagingManager = new MessagingManager();
    await messagingManager.init();
    
    // Load family chat messages
    const familyChatId = 1; // The Johnson Family chat ID
    await messagingManager.loadMessages(familyChatId);
    
    // Setup message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                messagingManager.sendMessage();
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        });
    }
    
    // Start polling for new messages
    messagingManager.startMessagePolling();
});

// Global task action functions
window.acceptTask = async (assignmentId) => {
    try {
        const response = await fetch(`/api/assignments/${assignmentId}/accept`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            location.reload(); // Refresh to show updated status
        } else {
            console.error('Failed to accept task');
            alert('Er is een fout opgetreden bij het accepteren van de taak.');
        }
    } catch (error) {
        console.error('Error accepting task:', error);
        alert('Er is een fout opgetreden bij het accepteren van de taak.');
    }
};

window.declineTask = async (assignmentId) => {
    try {
        const reason = prompt('Waarom wil je deze taak weigeren?');
        if (!reason || reason.trim() === '') {
            alert('Je moet een reden opgeven om de taak te weigeren.');
            return;
        }
        
        const response = await fetch(`/api/assignments/${assignmentId}/decline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason.trim() }),
            credentials: 'include'
        });

        if (response.ok) {
            location.reload(); // Refresh to show updated status
        } else {
            console.error('Failed to decline task');
            alert('Er is een fout opgetreden bij het weigeren van de taak.');
        }
    } catch (error) {
        console.error('Error declining task:', error);
        alert('Er is een fout opgetreden bij het weigeren van de taak.');
    }
};

window.completeTask = async (assignmentId) => {
    try {
        const response = await fetch(`/api/assignments/${assignmentId}/complete`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            location.reload(); // Refresh to show updated status
        } else {
            console.error('Failed to complete task');
            alert('Er is een fout opgetreden bij het voltooien van de taak.');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        alert('Er is een fout opgetreden bij het voltooien van de taak.');
    }
};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DashboardManager.init();
    });
} else {
    DashboardManager.init();
} 