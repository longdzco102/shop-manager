/* Sales Page */
const SalesPage = {
    products: [],
    cart: [],

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="sale-layout">
                <div>
                    <div class="card" style="margin-bottom:24px">
                        <div class="card-header">
                            <div class="card-title">Chọn sản phẩm</div>
                            <div class="search-box" style="max-width:250px">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" id="sale-product-search" placeholder="Tìm sản phẩm...">
                            </div>
                        </div>
                        <div class="product-grid-select" id="product-select-grid">
                            <div class="loading"><div class="spinner"></div></div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Lịch sử bán hàng</div>
                        </div>
                        <div id="sales-history"></div>
                    </div>
                </div>
                <div>
                    <div class="card" style="position:sticky;top:80px">
                        <div class="card-header">
                            <div class="card-title">🛒 Giỏ hàng</div>
                            <button class="btn btn-sm btn-secondary" id="clear-cart-btn">Xóa tất cả</button>
                        </div>
                        <div id="cart-items">
                            <div class="empty-state" style="padding:30px"><p>Chưa có sản phẩm</p></div>
                        </div>
                        <div class="cart-total" id="cart-total" style="display:none">
                            <span>Tổng cộng:</span>
                            <span class="total-value" id="cart-total-value">0₫</span>
                        </div>
                        <button class="btn btn-primary btn-block" id="checkout-btn" style="margin-top:16px" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                            Tạo đơn hàng
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('sale-product-search').addEventListener('input', (e) => {
            this.renderProductGrid(e.target.value);
        });

        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.cart = [];
            this.renderCart();
        });

        document.getElementById('checkout-btn').addEventListener('click', () => this.checkout());

        this.cart = [];
        await this.loadProducts();
        await this.loadSalesHistory();
    },

    async loadProducts() {
        try {
            this.products = await App.api('/products');
            this.renderProductGrid();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderProductGrid(search = '') {
        const grid = document.getElementById('product-select-grid');
        if (!grid) return;

        let filtered = this.products;
        if (search) {
            filtered = this.products.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>Không tìm thấy sản phẩm</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(p => `
            <div class="product-select-card ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="SalesPage.addToCart(${p.id})">
                <div class="prod-name">${p.name}</div>
                <div class="prod-price">${App.formatCurrency(p.price)}</div>
                <div class="prod-stock">Kho: ${p.stock}</div>
            </div>
        `).join('');
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        const existing = this.cart.find(c => c.product_id === productId);
        if (existing) {
            if (existing.quantity >= product.stock) {
                App.toast(`Không đủ hàng tồn kho cho "${product.name}"`, 'error');
                return;
            }
            existing.quantity++;
        } else {
            this.cart.push({
                product_id: productId,
                name: product.name,
                price: product.price,
                quantity: 1,
                maxStock: product.stock
            });
        }
        this.renderCart();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(c => c.product_id !== productId);
        this.renderCart();
    },

    updateCartQty(productId, qty) {
        const item = this.cart.find(c => c.product_id === productId);
        if (!item) return;
        qty = parseInt(qty);
        if (qty <= 0) {
            this.removeFromCart(productId);
            return;
        }
        if (qty > item.maxStock) {
            App.toast('Vượt quá tồn kho!', 'error');
            return;
        }
        item.quantity = qty;
        this.renderCart();
    },

    renderCart() {
        const cartEl = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        const totalValEl = document.getElementById('cart-total-value');
        const checkoutBtn = document.getElementById('checkout-btn');
        if (!cartEl) return;

        if (this.cart.length === 0) {
            cartEl.innerHTML = '<div class="empty-state" style="padding:30px"><p>Chưa có sản phẩm</p></div>';
            totalEl.style.display = 'none';
            checkoutBtn.disabled = true;
            return;
        }

        let total = 0;
        cartEl.innerHTML = this.cart.map(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${App.formatCurrency(item.price)} × ${item.quantity} = ${App.formatCurrency(subtotal)}</div>
                    </div>
                    <div class="cart-item-qty">
                        <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}"
                            onchange="SalesPage.updateCartQty(${item.product_id}, this.value)">
                        <button class="btn-icon" onclick="SalesPage.removeFromCart(${item.product_id})" title="Xóa">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        totalEl.style.display = 'flex';
        totalValEl.textContent = App.formatCurrency(total);
        checkoutBtn.disabled = false;
    },

    async checkout() {
        console.log('🛒 Starting checkout process. Cart items:', this.cart.length);
        if (this.cart.length === 0) return;

        if (!confirm('Xác nhận tạo đơn hàng?')) {
            console.log('🚫 Checkout cancelled by user');
            return;
        }

        try {
            const items = this.cart.map(c => ({
                product_id: c.product_id,
                quantity: c.quantity
            }));
            console.log('📤 Sending create sale request to API:', items);
            const result = await App.api('/sales', { method: 'POST', body: JSON.stringify({ items }) });
            console.log('✅ Checkout successful:', result);

            App.toast('Tạo đơn hàng thành công! 🎉', 'success');
            this.cart = [];
            await this.loadProducts();
            this.renderCart();
            await this.loadSalesHistory();
        } catch (err) {
            console.error('❌ Checkout error:', err);
            App.toast(err.message, 'error');
        }
    },

    async loadSalesHistory() {
        try {
            const sales = await App.api('/sales');
            const el = document.getElementById('sales-history');
            if (!el) return;

            if (sales.length === 0) {
                el.innerHTML = '<div class="empty-state"><p>Chưa có đơn hàng</p></div>';
                return;
            }

            el.innerHTML = `
                <div class="table-container">
                    <table>
                        <thead><tr>
                            <th>ID</th><th>Nhân viên</th><th>Tổng</th><th>Thời gian</th><th></th>
                        </tr></thead>
                        <tbody>
                            ${sales.map(s => `
                                <tr>
                                    <td>#${s.id}</td>
                                    <td>${s.full_name || s.username}</td>
                                    <td style="color:var(--success);font-weight:600">${App.formatCurrency(s.total)}</td>
                                    <td>${App.formatDateTime(s.created_at)}</td>
                                    <td><button class="btn btn-sm btn-secondary" onclick="SalesPage.viewSaleDetail(${s.id})">Chi tiết</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) { console.log(err); }
    },

    async viewSaleDetail(id) {
        try {
            const sale = await App.api(`/sales/${id}`);
            App.showModal(`Đơn hàng #${id}`, `
                <div style="margin-bottom:16px">
                    <strong>Nhân viên:</strong> ${sale.full_name || sale.username}<br>
                    <strong>Thời gian:</strong> ${App.formatDateTime(sale.created_at)}
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${App.formatCurrency(item.price)}</td>
                                    <td style="font-weight:600">${App.formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="cart-total">
                    <span>Tổng cộng:</span>
                    <span class="total-value">${App.formatCurrency(sale.total)}</span>
                </div>
            `);
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

// Ensure global access for onclick handlers
window.SalesPage = SalesPage;

