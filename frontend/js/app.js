/* ======================================
   SHOP MANAGEMENT - UNIFIED APP
   SPA Router, Auth (all roles), Theme Toggle
   ====================================== */

const App = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    currentPage: null,
    theme: localStorage.getItem('myshop-theme') || 'dark',

    // ============ API HELPER ============
    async api(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        // For cart session fallback
        const sid = localStorage.getItem('cart_session');
        if (sid) headers['X-Session-ID'] = sid;

        try {
            const res = await fetch(`/api${endpoint}`, { ...options, headers });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401 && this.token) {
                    // Token hết hạn khi đang dùng → logout
                    this.logout();
                    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                }
                throw new Error(data.error || 'Có lỗi xảy ra');
            }
            return data;
        } catch (err) {
            if (err.message !== 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
                console.error('API Error:', err);
            }
            throw err;
        }
    },

    // ============ UTILITIES ============
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    },
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    // Cart session ID for guest carts
    getSessionId() {
        let sid = localStorage.getItem('cart_session');
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('cart_session', sid);
        }
        return sid;
    },

    // ============ TOAST ============
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

    // ============ MODAL ============
    showModal(title, bodyHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-overlay').style.display = 'flex';
    },
    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // ============ THEME ============
    applyTheme(theme) {
        this.theme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('myshop-theme', theme);
        // Update toggle icon
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'light'
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
            btn.title = theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode';
        }
    },
    toggleTheme() {
        this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
    },

    // ============ AUTH ============
    isCustomer() { return this.user && this.user.role === 'customer'; },
    isStaff() { return this.user && (this.user.role === 'staff' || this.user.role === 'admin'); },
    isAdmin() { return this.user && this.user.role === 'admin'; },

    async loginStaff(username, password) {
        const data = await this.api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this._setAuth(data);
    },

    async loginCustomer(username, password) {
        const data = await this.api('/customer-auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this._setAuth(data);
    },

    async registerCustomer(username, password, full_name) {
        const data = await this.api('/customer-auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, full_name })
        });
        this._setAuth(data);
    },

    _setAuth(data) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.showApp();
    },

    logout() {
        this.token = null;
        this.user = null;
        this.currentPage = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clean up customer mode
        document.body.classList.remove('customer-mode');
        const custHeader = document.getElementById('customer-header');
        if (custHeader) custHeader.style.display = 'none';
        // Hide AI chat
        const aiBtn = document.getElementById('ai-chat-toggle');
        if (aiBtn) aiBtn.style.display = 'none';
        const aiWindow = document.getElementById('ai-chat-window');
        if (aiWindow) aiWindow.classList.remove('open');
        // Show login, hide app
        document.getElementById('app').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        // Reset forms
        const staffForm = document.getElementById('login-form-staff');
        if (staffForm) staffForm.reset();
        document.getElementById('login-error').style.display = 'none';
    },

    // ============ SHOW APP ============
    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        const name = this.user.full_name || this.user.username;
        document.getElementById('user-name').textContent = name;
        const custNameEl = document.getElementById('customer-user-name');
        if (custNameEl) custNameEl.textContent = name;
        // Sync mobile sidebar
        const mobileNavName = document.getElementById('mobile-nav-username');
        if (mobileNavName) mobileNavName.textContent = name;
        const mobileNavAvatar = document.querySelector('.mobile-nav-avatar');
        if (mobileNavAvatar) mobileNavAvatar.textContent = name.charAt(0).toUpperCase();
        document.getElementById('user-role').textContent = this.user.role === 'customer' ? 'Khách hàng' : this.user.role;
        document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
        document.getElementById('role-badge').textContent = this.user.role === 'customer' ? 'Khách hàng' : this.user.role;

        // Show/hide nav items based on role
        const role = this.user.role;
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = role === 'admin' ? '' : 'none';
        });
        document.querySelectorAll('.staff-only').forEach(el => {
            el.style.display = (role === 'admin' || role === 'staff') ? '' : 'none';
        });
        document.querySelectorAll('.customer-item').forEach(el => {
            el.style.display = role === 'customer' ? '' : 'none';
        });

        // Add customer-mode class to body for specific CSS
        if (role === 'customer') {
            document.body.classList.add('customer-mode');
            document.getElementById('customer-header').style.display = 'block';
            document.getElementById('admin-topbar').style.display = 'none';
        } else {
            document.body.classList.remove('customer-mode');
            document.getElementById('customer-header').style.display = 'none';
            document.getElementById('admin-topbar').style.display = 'flex';
        }
        // Nav divider
        document.querySelectorAll('.nav-divider').forEach(el => {
            el.style.display = (role === 'admin' || role === 'staff') ? 'none' : 'none'; // always hide for now since roles are separate
        });

        // AI Chatbot - only for customers
        const aiBtn = document.getElementById('ai-chat-toggle');
        if (aiBtn) aiBtn.style.display = this.isCustomer() ? '' : 'none';

        // Navigate to default page
        if (this.isCustomer()) {
            this.navigate('shop');
        } else {
            this.navigate('dashboard');
        }
    },

    // ============ NAVIGATION ============
    navigate(page) {
        this.currentPage = page;

        // Update nav active state
        document.querySelectorAll('.nav-item, .header-nav-link').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            products: 'Quản lý Sản phẩm',
            sales: 'Bán hàng',
            procurements: 'Nhập hàng',
            expenses: 'Quản lý Chi phí',
            attendance: 'Quản lý Ca',
            reports: 'Báo cáo',
            users: 'Quản lý Nhân viên',
            discounts: 'Mã Giảm Giá',
            shop: '🛍️ Cửa hàng',
            'my-cart': '🛒 Giỏ hàng',
            'my-orders': '📋 Đơn hàng của tôi',
            checkout: '📦 Thanh toán',
            about: 'ℹ️ Về chúng tôi'
        };
        document.getElementById('page-title').textContent = titles[page] || page;

        // Load page content
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');

        // Load page module
        switch (page) {
            case 'dashboard': if (typeof DashboardPage !== 'undefined') DashboardPage.render(); break;
            case 'products': if (typeof ProductsPage !== 'undefined') ProductsPage.render(); break;
            case 'sales': if (typeof SalesPage !== 'undefined') SalesPage.render(); break;
            case 'procurements': if (typeof ProcurementsPage !== 'undefined') ProcurementsPage.render(); break;
            case 'expenses': if (typeof ExpensesPage !== 'undefined') ExpensesPage.render(); break;
            case 'attendance': if (typeof AttendancePage !== 'undefined') AttendancePage.render(); break;
            case 'reports': if (typeof ReportsPage !== 'undefined') ReportsPage.render(); break;
            case 'users': if (typeof UsersPage !== 'undefined') UsersPage.render(); break;
            case 'discounts': if (typeof DiscountsPage !== 'undefined') DiscountsPage.render(); break;
            // Customer pages
            case 'shop': if (typeof ShopBrowsePage !== 'undefined') ShopBrowsePage.render(); break;
            case 'my-cart': if (typeof CustomerCartPage !== 'undefined') CustomerCartPage.render(); break;
            case 'my-orders': if (typeof CustomerOrdersPage !== 'undefined') CustomerOrdersPage.render(); break;
            case 'checkout': if (typeof CustomerCheckoutPage !== 'undefined') CustomerCheckoutPage.render(); break;
            case 'about': if (typeof CustomerAboutPage !== 'undefined') CustomerAboutPage.render(); break;
        }
    },

    // ============ INIT ============
    init() {
        // Apply saved theme
        this.applyTheme(this.theme);

        // ---- Login Tab Switching ----
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                document.getElementById('login-form-staff').style.display = target === 'login-staff' ? 'block' : 'none';
                document.getElementById('login-form-customer').style.display = target === 'login-customer' ? 'block' : 'none';
            });
        });

        // Customer sub-tabs (login/register)
        document.querySelectorAll('.cust-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cust-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.panel;
                document.getElementById('cust-login').style.display = target === 'cust-login' ? 'block' : 'none';
                document.getElementById('cust-register').style.display = target === 'cust-register' ? 'block' : 'none';
            });
        });

        // ---- Staff/Admin Login ----
        document.getElementById('login-form-staff').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            const btn = document.getElementById('login-btn');
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Đang đăng nhập...';
            try {
                await this.loginStaff(username, password);
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.querySelector('span').textContent = 'Đăng nhập';
            }
        });

        // ---- Customer Login ----
        document.getElementById('cust-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('cust-login-user').value;
            const password = document.getElementById('cust-login-pass').value;
            const errorEl = document.getElementById('cust-login-error');
            try {
                await this.loginCustomer(username, password);
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            }
        });

        // ---- Customer Register ----
        document.getElementById('cust-register').addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('cust-reg-name').value;
            const username = document.getElementById('cust-reg-user').value;
            const password = document.getElementById('cust-reg-pass').value;
            const errorEl = document.getElementById('cust-reg-error');
            try {
                await this.registerCustomer(username, password, full_name);
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            }
        });

        // ---- Navigation ----
        document.querySelectorAll('.nav-item, .header-nav-link').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (item.dataset.page) this.navigate(item.dataset.page);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        const custLogout = document.getElementById('customer-logout-btn');
        if (custLogout) custLogout.addEventListener('click', () => this.logout());

        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());
        const custThemeBtn = document.getElementById('customer-theme-toggle');
        if (custThemeBtn) custThemeBtn.addEventListener('click', () => this.toggleTheme());

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // Check if already logged in
        if (this.token && this.user) {
            this.showApp();
        }

        // Initialize Chatbot
        this.initChatbot();
    },

    // ============ AI CHATBOT ============
    initChatbot() {
        const toggleBtn = document.getElementById('ai-chat-toggle');
        const chatWindow = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('ai-chat-close');
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        const body = document.getElementById('ai-chat-body');

        if (!toggleBtn || !chatWindow) return;

        const toggleChat = () => chatWindow.classList.toggle('show');
        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        const appendMessage = (text, sender, isLoading = false) => {
            const msg = document.createElement('div');
            msg.className = `ai-msg ${sender} ${isLoading ? 'loading' : ''}`;
            if (isLoading) {
                msg.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;border-color:var(--text-muted) transparent transparent transparent"></div>';
                msg.id = 'ai-loading';
            } else {
                const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                msg.innerHTML = formattedText;
                const loadingEl = document.getElementById('ai-loading');
                if (loadingEl) loadingEl.remove();
            }
            body.appendChild(msg);
            body.scrollTop = body.scrollHeight;
        };

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            sendBtn.disabled = true;
            appendMessage(text, 'user');
            appendMessage('', 'bot', true);
            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${App.token}`
                    },
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                if (data.setupRequired) App.toast('Admin cần cấu hình GEMINI_API_KEY', 'error');
                appendMessage(data.reply || data.error || 'Không nhận được phản hồi', 'bot');
            } catch (err) {
                appendMessage('❌ Không thể kết nối đến server. Kiểm tra lại kết nối mạng.', 'bot');
            } finally {
                sendBtn.disabled = false;
                input.focus();
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
