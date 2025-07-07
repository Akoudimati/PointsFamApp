// PointsFam - Dashboard JavaScript (Simplified)

class DashboardManager {
    constructor() {
        this.selectedChildId = 'all';
        this.allChildren = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            try {
                const response = await fetch('/api/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                window.dashboardData = data;
                
                if (data.user.role === 'parent') {
                    this.setupChildSelection(data.family_members);
                }
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                this.showNotification('Er is een fout opgetreden bij het laden van het dashboard.', 'danger');
            }

            this.setupBasicFeatures();
        });
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
        return new DashboardManager();
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DashboardManager.init();
    });
} else {
    DashboardManager.init();
} 