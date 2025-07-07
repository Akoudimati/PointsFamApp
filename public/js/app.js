// PointsFam - Main Application (Simplified)

class PointsFamApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupAuthHandlers();
        this.setupFormValidation();
        this.setupNavigation();
    }

    setupAuthHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });
        }

        // Logout buttons
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleLogout();
            });
        });
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.showMessage('Succesvol ingelogd!', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            } else {
                this.showMessage(data.error || 'Login mislukt', 'danger');
            }
        } catch (error) {
            this.showMessage('Er is een fout opgetreden', 'danger');
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const registerData = {
            username: formData.get('username'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            role: formData.get('role'),
            familyName: formData.get('familyName')
        };

        if (registerData.password !== registerData.confirmPassword) {
            this.showMessage('Wachtwoorden komen niet overeen', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Registratie succesvol! Je kunt nu inloggen.', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Registratie mislukt', 'danger');
            }
        } catch (error) {
            this.showMessage('Er is een fout opgetreden', 'danger');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });
            });
        });
    }

    validateInput(input) {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            return false;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            return true;
        }
    }

    setupNavigation() {
        // Simple navigation handling
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active to clicked link
                e.target.classList.add('active');
            });
        });
    }

    showMessage(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || document.body;
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertElement.textContent = message;
        
        alertContainer.appendChild(alertElement);
        
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.parentNode.removeChild(alertElement);
            }
        }, 5000);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PointsFamApp();
    });
} else {
    new PointsFamApp();
} 