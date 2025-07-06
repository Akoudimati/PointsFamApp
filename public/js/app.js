// PointsFam - Main Application JavaScript

class PointsFamApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.setupAnimations();
            this.setupFormValidation();
            this.setupTooltips();
            this.loadCurrentUser();
        });
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    setupEventListeners() {
        // Auto-dismiss alerts after 5 seconds
        this.setupAutoAlerts();
        
        // Smooth scrolling for anchor links
        this.setupSmoothScrolling();
        
        // Form submission handling
        this.setupFormSubmissions();
        
        // Modal handling
        this.setupModals();
    }

    setupAutoAlerts() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        });
    }

    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId !== '#') {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    setupFormSubmissions() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    // Add loading state
                    this.setButtonLoading(submitBtn, true);
                    
                    // Remove loading state after a delay (in case of errors)
                    setTimeout(() => {
                        this.setButtonLoading(submitBtn, false);
                    }, 10000);
                }
            });
        });
    }

    setupModals() {
        // Handle modal events
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                // Focus first input in modal
                const firstInput = modal.querySelector('input, select, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            });
        });
    }

    setupAnimations() {
        // Add fade-in animation to cards when they come into view
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });

            // Observe all cards
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                observer.observe(card);
            });
        }
    }

    setupFormValidation() {
        // Custom form validation
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });

        // Real-time validation feedback
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Utility Functions
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.dataset.originalText = originalText;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Laden...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        let isValid = true;
        let message = '';

        // Required validation
        if (required && !value) {
            isValid = false;
            message = 'Dit veld is verplicht.';
        }

        // Type-specific validation
        if (value && type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Voer een geldig e-mailadres in.';
            }
        }

        if (value && type === 'number') {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                isValid = false;
                message = 'Voer een geldig getal in.';
            } else if (min && numValue < parseFloat(min)) {
                isValid = false;
                message = `Minimale waarde is ${min}.`;
            } else if (max && numValue > parseFloat(max)) {
                isValid = false;
                message = `Maximale waarde is ${max}.`;
            }
        }

        // Update field validation state
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }

        // Update validation message
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }

        return isValid;
    }

    // API Helper Functions
    async makeAPICall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alert-container') || document.body;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-2">
                    ${this.getAlertIcon(type)}
                </div>
                <div class="flex-grow-1">
                    ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
    }

    getAlertIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-success"></i>',
            danger: '<i class="fas fa-exclamation-circle text-danger"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-warning"></i>',
            info: '<i class="fas fa-info-circle text-info"></i>'
        };
        return icons[type] || icons.info;
    }

    // Static utility methods
    static formatNumber(number) {
        return new Intl.NumberFormat('nl-NL').format(number);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('nl-NL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static confirmAction(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    // Initialize the app
    static init() {
        return new PointsFamApp();
    }
}

// Initialize the app when the script loads
const app = PointsFamApp.init(); 