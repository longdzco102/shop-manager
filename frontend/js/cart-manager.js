// Cart Manager - handles both guest (session) and logged-in user carts
const CartManager = {
    getSessionId() {
        let sid = localStorage.getItem('cart_session');
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('cart_session', sid);
        }
        return sid;
    },

    _headers() {
        const h = { 'Content-Type': 'application/json', 'X-Session-ID': this.getSessionId() };
        const token = AuthManager.getToken();
        if (token) h['Authorization'] = 'Bearer ' + token;
        return h;
    },

    async getCart() {
        try {
            const res = await fetch('/api/cart', { headers: this._headers() });
            if (!res.ok) return { items: [], total: 0, itemCount: 0 };
            return await res.json();
        } catch { return { items: [], total: 0, itemCount: 0 }; }
    },

    async addItem(productId, quantity = 1) {
        const res = await fetch('/api/cart/items', {
            method: 'POST', headers: this._headers(),
            body: JSON.stringify({ productId, quantity })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        await this.updateBadge();
        return await res.json();
    },

    async updateQuantity(cartItemId, quantity) {
        await fetch(`/api/cart/items/${cartItemId}`, {
            method: 'PUT', headers: this._headers(),
            body: JSON.stringify({ quantity })
        });
        await this.updateBadge();
    },

    async removeItem(cartItemId) {
        await fetch(`/api/cart/items/${cartItemId}`, {
            method: 'DELETE', headers: this._headers()
        });
        await this.updateBadge();
    },

    async updateBadge() {
        const cart = await this.getCart();
        const badges = document.querySelectorAll('#cartBadge, .cart-badge');
        badges.forEach(b => b.textContent = cart.itemCount || 0);
    }
};
