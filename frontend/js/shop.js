const ShopApp = {
    products: [],
    cart: [],

    // Helpers
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    },

    toast(msg, type = 'success') {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.innerHTML = `<span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
    },

    // Initialization
    async init() {
        this.cart = JSON.parse(localStorage.getItem('shop_cart') || '[]');
        this.updateCartUI();

        // Event Listeners
        document.getElementById('cart-toggle').addEventListener('click', () => {
            document.getElementById('cart-overlay').classList.add('open');
        });
        document.getElementById('close-cart').addEventListener('click', () => {
            document.getElementById('cart-overlay').classList.remove('open');
        });
        document.getElementById('cart-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') document.getElementById('cart-overlay').classList.remove('open');
        });

        document.getElementById('btn-checkout').addEventListener('click', () => {
            if (this.cart.length === 0) return this.toast('Giỏ hàng trống!', 'error');
            document.getElementById('btn-checkout').style.display = 'none';
            document.getElementById('checkout-form-container').style.display = 'block';
        });

        document.getElementById('btn-submit-order').addEventListener('click', () => this.submitOrder());

        // Load data
        await this.loadProducts();
    },

    async loadProducts() {
        try {
            const res = await fetch('/api/shop/products');
            this.products = await res.json();
            this.renderProducts();
        } catch (err) {
            this.toast('Không thể tải sản phẩm. Hãy thử lại.', 'error');
        }
    },

    renderProducts() {
        const grid = document.getElementById('product-list');
        if (this.products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted)">Không có sản phẩm nào đang bán.</div>';
            return;
        }

        grid.innerHTML = this.products.map(p => `
            <div class="product-card">
                <img src="${p.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${p.name}" class="product-img">
                <div class="product-info">
                    <div class="product-category">${p.category || 'Chưa phân loại'}</div>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price-row">
                        <span class="product-price">${this.formatCurrency(p.price)}</span>
                        <span class="product-stock">Kho: ${p.stock}</span>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="ShopApp.addToCart(${p.id})">Thêm vào giỏ</button>
                </div>
            </div>
        `).join('');
    },

    addToCart(id) {
        const p = this.products.find(x => x.id === id);
        if (!p) return;

        const existing = this.cart.find(x => x.product_id === id);
        if (existing) {
            if (existing.quantity >= p.stock) return this.toast('Không đủ hàng trong kho!', 'error');
            existing.quantity++;
        } else {
            this.cart.push({ product_id: p.id, name: p.name, price: p.price, quantity: 1, image_url: p.image_url });
        }

        this.saveCart();
        this.updateCartUI();
        this.toast(`Đã thêm ${p.name}`);
        document.getElementById('cart-overlay').classList.add('open');
    },

    updateQty(id, delta) {
        const item = this.cart.find(x => x.product_id === id);
        if (!item) return;

        const p = this.products.find(x => x.id === id);

        item.quantity += delta;

        if (item.quantity <= 0) {
            this.cart = this.cart.filter(x => x.product_id !== id);
        } else if (p && item.quantity > p.stock) {
            item.quantity = p.stock;
            this.toast('Đạt tối đa tồn kho!', 'error');
        }

        this.saveCart();
        this.updateCartUI();
    },

    removeItem(id) {
        this.cart = this.cart.filter(x => x.product_id !== id);
        this.saveCart();
        this.updateCartUI();
    },

    saveCart() {
        localStorage.setItem('shop_cart', JSON.stringify(this.cart));
    },

    updateCartUI() {
        const container = document.getElementById('cart-items');
        document.getElementById('cart-count').textContent = this.cart.reduce((s, x) => s + x.quantity, 0);

        if (this.cart.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 40px">Giỏ hàng trống</div>';
            document.getElementById('cart-total-price').textContent = '0 đ';
            return;
        }

        let total = 0;
        container.innerHTML = this.cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.image_url || 'https://via.placeholder.com/60'}" alt="" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${this.formatCurrency(item.price)}</div>
                        <div class="cart-qty-ctrl">
                            <button class="qty-btn" onclick="ShopApp.updateQty(${item.product_id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="ShopApp.updateQty(${item.product_id}, 1)">+</button>
                            <button class="remove-item" onclick="ShopApp.removeItem(${item.product_id})">Xóa</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('cart-total-price').textContent = this.formatCurrency(total);
    },

    async submitOrder() {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const btn = document.getElementById('btn-submit-order');

        if (!name || !phone) return this.toast('Vui lòng nhập họ tên và số điện thoại.', 'error');
        if (this.cart.length === 0) return this.toast('Giỏ hàng trống.', 'error');

        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        try {
            const res = await fetch('/api/shop/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    customer_phone: phone,
                    items: this.cart
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Lỗi đặt hàng');

            this.toast('Đặt hàng thành công!', 'success');
            this.cart = [];
            this.saveCart();
            this.updateCartUI();

            document.getElementById('checkout-form-container').style.display = 'none';
            document.getElementById('btn-checkout').style.display = 'block';
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-phone').value = '';

            setTimeout(() => {
                document.getElementById('cart-overlay').classList.remove('open');
                this.loadProducts(); // re-fetch to update stock
            }, 1500);

        } catch (err) {
            this.toast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Xác nhận Đặt hàng';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ShopApp.init());
