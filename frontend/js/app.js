/* ======================================
   SHOP MANAGEMENT - MAIN APP
   SPA Router, Auth, API Helper
   ====================================== */

const App = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    currentPage: 'dashboard',

    // API Helper
    async api(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        try {
            const res = await fetch(`/api${endpoint}`, { ...options, headers });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) {
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.error || 'Something went wrong');
            }
            return data;
        } catch (err) {
            if (err.message !== 'Session expired. Please login again.') {
                console.error('API Error:', err);
            }
            throw err;
        }
    },

    // Format currency VND
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Format date
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // Format datetime
    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Toast notification
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = {
            success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
            error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Modal
    showModal(title, bodyHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // Login
    async login(username, password) {
        const data = await this.api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.showApp();
    },

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.getElementById('app').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').style.display = 'none';
    },

    // Show main app
    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        // Update user info
        const name = this.user.full_name || this.user.username;
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-role').textContent = this.user.role;
        document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
        document.getElementById('role-badge').textContent = this.user.role;

        // Show/hide admin elements
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(el => {
            el.style.display = this.user.role === 'admin' ? '' : 'none';
        });

        this.navigate('dashboard');
    },

    // Navigate to page
    navigate(page) {
        this.currentPage = page;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            products: 'Quản lý Sản phẩm',
            sales: 'Bán hàng',
            expenses: 'Quản lý Chi phí',
            reports: 'Báo cáo',
            users: 'Quản lý Nhân viên'
        };
        document.getElementById('page-title').textContent = titles[page] || page;

        // Load page content
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');

        // Load page module
        switch (page) {
            case 'dashboard': DashboardPage.render(); break;
            case 'products': ProductsPage.render(); break;
            case 'sales': SalesPage.render(); break;
            case 'expenses': ExpensesPage.render(); break;
            case 'reports': ReportsPage.render(); break;
            case 'users': UsersPage.render(); break;
        }
    },

    // Init
    init() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            const btn = document.getElementById('login-btn');

            btn.disabled = true;
            btn.querySelector('span').textContent = 'Đang đăng nhập...';

            try {
                await this.login(username, password);
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.querySelector('span').textContent = 'Đăng nhập';
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.page);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // Check if already logged in
        if (this.token && this.user) {
            this.showApp();
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
