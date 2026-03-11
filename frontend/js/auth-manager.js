// Auth Manager for customer-facing pages
const AuthManager = {
    getToken() {
        return localStorage.getItem('customer_token');
    },
    getUser() {
        const u = localStorage.getItem('customer_user');
        return u ? JSON.parse(u) : null;
    },
    setAuth(token, user) {
        localStorage.setItem('customer_token', token);
        localStorage.setItem('customer_user', JSON.stringify(user));
    },
    clearAuth() {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    updateUI() {
        const user = this.getUser();
        const loginLink = document.getElementById('loginLink');
        const userMenu = document.getElementById('userMenu');
        const greeting = document.getElementById('userGreeting');

        if (user) {
            if (loginLink) loginLink.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (greeting) greeting.textContent = user.full_name || user.username;
        } else {
            if (loginLink) loginLink.style.display = 'inline-flex';
            if (userMenu) userMenu.style.display = 'none';
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.clearAuth();
                window.location.href = '/';
            });
        }
    }
};
