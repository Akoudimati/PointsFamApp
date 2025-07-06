// PointsFam - Theme Switcher

class ThemeSwitcher {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        this.themeText = document.getElementById('theme-text');
        this.lightThemeLink = document.getElementById('theme-light');
        this.darkThemeLink = document.getElementById('theme-dark');
        
        this.init();
    }

    init() {
        // Set initial theme
        this.applyTheme(this.currentTheme);
        
        // Add event listener to theme toggle button
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.storeTheme(newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        
        if (theme === 'dark') {
            // Enable dark theme
            if (this.lightThemeLink) this.lightThemeLink.disabled = true;
            if (this.darkThemeLink) this.darkThemeLink.disabled = false;
            
            // Update icon and text
            if (this.themeIcon) {
                this.themeIcon.className = 'bi bi-moon-fill';
            }
            if (this.themeText) {
                this.themeText.textContent = 'Licht thema';
            }
            
            // Update button title
            if (this.themeToggleBtn) {
                this.themeToggleBtn.title = 'Schakel naar licht thema';
            }
        } else {
            // Enable light theme
            if (this.lightThemeLink) this.lightThemeLink.disabled = false;
            if (this.darkThemeLink) this.darkThemeLink.disabled = true;
            
            // Update icon and text
            if (this.themeIcon) {
                this.themeIcon.className = 'bi bi-sun-fill';
            }
            if (this.themeText) {
                this.themeText.textContent = 'Donker thema';
            }
            
            // Update button title
            if (this.themeToggleBtn) {
                this.themeToggleBtn.title = 'Schakel naar donker thema';
            }
        }

        // Add transition class for smooth theme switching
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('pointsfam-theme');
        } catch (e) {
            return null;
        }
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('pointsfam-theme', theme);
        } catch (e) {
            // localStorage not available, ignore
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Public method to set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            this.storeTheme(theme);
        }
    }
}

// CSS for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .theme-transition * {
        transition: background-color 0.3s ease, 
                   color 0.3s ease, 
                   border-color 0.3s ease,
                   box-shadow 0.3s ease !important;
    }
`;
document.head.appendChild(style);

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
} 