/* ======================================
   CUSTOMER CART PAGE - Style giống Web_DACN/cart.html
   Layout: cart-left (items) + cart-right (summary)
   ====================================== */
const CustomerCartPage = {
    cart: null,

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            this.cart = await App.api('/cart');
            this.renderCart();
        } catch (err) {
            content.innerHTML = '<div style="text-align:center; padding: 50px;"><p>Lỗi tải giỏ hàng</p></div>';
        }
    },

    renderCart() {
        const content = document.getElementById('content-area');
        if (!this.cart.items || this.cart.items.length === 0) {
            content.innerHTML = `
                <section class="shop-content">
                    <div style="text-align: center; padding: 50px; background: white; border-radius: 12px; margin-top: 40px;">
                        <h3>🛒 Giỏ hàng trống</h3>
                        <p style="color:#64748b;margin-bottom:20px;">Hãy thêm sản phẩm để bắt đầu mua sắm!</p>
                        <button class="btn-solid-red" onclick="App.navigate('shop')" style="width:auto;padding:12px 30px;">🛍️ Mua sắm ngay</button>
                    </div>
                </section>
            `;
            return;
        }

        content.innerHTML = `
            <section class="shop-content">
                <h2 class="cart-title">GIỎ HÀNG CỦA BẠN</h2>
                <div class="cart-content">
                    <div class="cart-left">
                        <!-- Header row -->
                        <div class="cart-header-row">
                            <div class="checkbox-wrapper">Sản phẩm</div>
                            <div class="header-qty">Số lượng</div>
                            <div class="header-price">Thành tiền</div>
                        </div>
                        <!-- Cart items -->
                        ${this.cart.items.map(item => `
                            <div class="cart-item">
                                <div class="item-image">
                                    <img src="${item.image_url || 'https://placehold.co/80x80/f5f5fa/999?text=SP'}" alt="${item.name}">
                                </div>
                                <div class="item-info">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-price-unit">
                                        <span class="current">${Number(item.final_price).toLocaleString('vi-VN')} đ</span>
                                        ${item.discount_percentage ? `<span class="discount-percent" style="font-size:11px;">-${item.discount_percentage}%</span>` : ''}
                                    </div>
                                </div>
                                <div class="item-qty">
                                    <div class="cart-qty">
                                        <button class="qty-btn" onclick="CustomerCartPage.updateQty(${item.id}, ${item.quantity - 1})">−</button>
                                        <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                        <button class="qty-btn" onclick="CustomerCartPage.updateQty(${item.id}, ${item.quantity + 1})">+</button>
                                    </div>
                                </div>
                                <div class="item-total-price">${Number(item.subtotal).toLocaleString('vi-VN')} đ</div>
                                <span class="item-delete" onclick="CustomerCartPage.removeItem(${item.id})" title="Xóa">🗑️</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cart-right">
                        <div class="cart-summary">
                            <div class="summary-row">
                                <span>Tạm tính (${this.cart.itemCount} sản phẩm):</span>
                                <span>${Number(this.cart.total).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div class="summary-row">
                                <span>Phí vận chuyển:</span>
                                <span style="color:#22c55e;">Miễn phí</span>
                            </div>
                            <div class="summary-row total-row">
                                <span>Tổng tiền:</span>
                                <span class="summary-total-value">${Number(this.cart.total).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <button class="btn-checkout active" onclick="App.navigate('checkout')">Mua hàng (${this.cart.itemCount})</button>
                            <button class="btn-continue" onclick="App.navigate('shop')" style="width: 100%; padding: 14px; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; background-color: #e2e8f0; color: #475569; margin-top: 10px;">← Tiếp tục mua sắm</button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    async updateQty(cartItemId, qty) {
        if (qty <= 0) { this.removeItem(cartItemId); return; }
        try {
            await App.api(`/cart/items/${cartItemId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: qty })
            });
            await this.render();
            if (typeof ShopBrowsePage !== 'undefined') ShopBrowsePage.updateCartBadge();
        } catch (err) { App.toast('Lỗi: ' + err.message, 'error'); }
    },

    async removeItem(cartItemId) {
        try {
            await App.api(`/cart/items/${cartItemId}`, { method: 'DELETE' });
            App.toast('Đã xóa sản phẩm', 'info');
            await this.render();
            if (typeof ShopBrowsePage !== 'undefined') ShopBrowsePage.updateCartBadge();
        } catch (err) { App.toast('Lỗi: ' + err.message, 'error'); }
    }
};
