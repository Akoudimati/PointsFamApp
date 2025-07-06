// PointsFam - Dashboard JavaScript

class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDashboardFeatures();
            this.setupStatistics();
        });
    }

    setupDashboardFeatures() {
        // Setup quick actions
        this.setupQuickActions();
        
        // Setup statistics animations
        this.setupStatistics();
    }

    setupQuickActions() {
        // Setup quick action cards
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Add ripple effect
                this.addRippleEffect(card, e);
            });
        });
    }

    setupStatistics() {
        // Animate counters
        this.animateCounters();
        
        // Setup progress bars if any
        this.setupProgressBars();
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number, .points-number, [id="user-points"], [id="completed-tasks"], [id="pending-tasks"]');
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const finalValue = parseInt(counter.textContent);
                    
                    if (finalValue > 0) {
                        this.animateCounter(counter, 0, finalValue, 1500);
                    }
                    
                    observer.unobserve(counter);
                }
            });
        }, observerOptions);
        
        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easedProgress = this.easeOutCubic(progress);
            const current = Math.round(start + (end - start) * easedProgress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    setupProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const targetWidth = progressBar.getAttribute('aria-valuenow');
                    
                    // Animate progress bar
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.transition = 'width 1.5s ease-out';
                        progressBar.style.width = targetWidth + '%';
                    }, 100);
                    
                    observer.unobserve(progressBar);
                }
            });
        }, observerOptions);
        
        progressBars.forEach(bar => {
            observer.observe(bar);
        });
    }

    addRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Add ripple animation CSS if not already present
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

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

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Static methods for global use
    static init() {
        return new DashboardManager();
    }
}

// Initialize dashboard manager
const dashboardManager = DashboardManager.init(); 