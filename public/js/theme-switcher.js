// PointsFam - Theme Switcher (Simplified)

class ThemeSwitcher {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.clearOldCache();
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
    }

    clearOldCache() {
        // Clear any cached resources that might be causing old styling issues
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            });
        }
        
        // Force refresh of stylesheets with timestamp
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
            if (link.href.includes('/css/')) {
                const url = new URL(link.href);
                url.searchParams.set('v', Date.now());
                link.href = url.toString();
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        const themeStylesheet = document.getElementById('theme-stylesheet');
        const themeIcon = document.getElementById('theme-icon');
        const timestamp = Date.now();
        
        if (theme === 'dark') {
            if (themeStylesheet) {
                themeStylesheet.href = `/css/dark-theme.css?v=${timestamp}`;
            }
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
        } else {
            if (themeStylesheet) {
                themeStylesheet.href = `/css/light-theme.css?v=${timestamp}`;
            }
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon';
            }
        }
    }
}

// Initialize theme switcher
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeSwitcher();
    });
} else {
    new ThemeSwitcher();
} 