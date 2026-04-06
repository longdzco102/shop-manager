/* ======================================
   CUSTOMER CHECKOUT PAGE
   Style giống Web_DACN/checkout.html
   + MoMo QR Payment
   ====================================== */
const CustomerCheckoutPage = {
    cart: null,
    appliedDiscount: null,
    paymentMethod: 'cod', // 'cod' | 'momo'

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            this.cart = await App.api('/cart');
            if (!this.cart.items || this.cart.items.length === 0) {
                App.navigate('my-cart');
                return;
            }
            this.appliedDiscount = null;
            this.paymentMethod = 'cod';
            this.renderCheckout();
        } catch (err) {
            content.innerHTML = '<div style="text-align:center; padding: 50px;"><p>Lỗi tải giỏ hàng</p></div>';
        }
    },

    renderCheckout() {
        const content = document.getElementById('content-area');
        const userName = App.user.full_name || App.user.username;
        content.innerHTML = `
            <div style="max-width: 1200px; margin: 40px auto; padding: 0 20px;">
                <h1 style="font-size: 24px; margin-bottom: 25px; color: #1e293b;">📦 Thanh toán đơn hàng</h1>
                
                <div style="display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap;">
                    
                    <div style="flex: 2; min-width: 300px; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        <form id="checkoutForm" onsubmit="return false;">
                            <h3 style="margin-bottom: 20px; font-size: 18px; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Thông tin người nhận</h3>
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #475569;">Họ và tên</label>
                                <input type="text" id="ship-name" required value="${userName}" placeholder="Ví dụ: Nguyễn Văn A" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;">
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #475569;">Số điện thoại</label>
                                <input type="tel" id="ship-phone" required placeholder="Ví dụ: 0901234567" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;">
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #475569;">Địa chỉ giao hàng chi tiết</label>
                                <textarea id="ship-address" required placeholder="Số nhà, Đường, Phường/Xã..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; height: 80px; resize: vertical;"></textarea>
                            </div>

                            <h3 style="margin-top: 30px; margin-bottom: 20px; font-size: 18px; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Mã giảm giá</h3>
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                <input type="text" id="discount-code" placeholder="Nhập mã giảm giá (nếu có)" style="flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;">
                                <button type="button" onclick="CustomerCheckoutPage.applyDiscount()" style="background-color: #64748b; color: #fff; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.3s;">Áp dụng</button>
                            </div>
                            <p id="discount-msg" style="font-size: 14px; min-height: 20px;"></p>

                            <h3 style="margin-top: 30px; margin-bottom: 16px; font-size: 18px; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Phương thức thanh toán</h3>
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <label id="pay-cod-label" style="flex:1; min-width:140px; display:flex; align-items:center; gap:10px; padding:14px 18px; border: 2px solid #6366f1; border-radius: 10px; cursor:pointer; background:#f0f0ff; transition:all 0.2s;">
                                    <input type="radio" name="payment" value="cod" checked onchange="CustomerCheckoutPage.selectPayment('cod')" style="width:18px;height:18px;accent-color:#6366f1;">
                                    <div>
                                        <div style="font-weight:600; color:#1e293b;">💵 Tiền mặt</div>
                                        <div style="font-size:12px; color:#64748b;">Thanh toán khi nhận hàng</div>
                                    </div>
                                </label>
                                <label id="pay-momo-label" style="flex:1; min-width:140px; display:flex; align-items:center; gap:10px; padding:14px 18px; border: 2px solid #e2e8f0; border-radius: 10px; cursor:pointer; background:#fff; transition:all 0.2s;">
                                    <input type="radio" name="payment" value="momo" onchange="CustomerCheckoutPage.selectPayment('momo')" style="width:18px;height:18px;accent-color:#ae2070;">
                                    <div>
                                        <div style="font-weight:600; color:#1e293b;">
                                            <svg width="20" height="20" viewBox="0 0 40 40" style="vertical-align:middle;margin-right:4px;" fill="none">
                                                <rect width="40" height="40" rx="8" fill="#AE2070"/>
                                                <text x="50%" y="56%" text-anchor="middle" fill="white" font-size="16" font-weight="bold" dy=".1em" font-family="Arial">M</text>
                                            </svg>
                                            MoMo QR
                                        </div>
                                        <div style="font-size:12px; color:#64748b;">Quét QR, thanh toán ngay</div>
                                    </div>
                                </label>
                            </div>

                            <!-- MoMo QR Section (ẩn mặc định) -->
                            <div id="momo-qr-section" style="display:none; margin-top:20px; padding:20px; background: linear-gradient(135deg, #fff0f7, #fce4ef); border:2px solid #ae2070; border-radius:12px; text-align:center;">
                                <div style="font-size:16px; font-weight:700; color:#ae2070; margin-bottom:4px;">📲 Quét QR để thanh toán MoMo</div>
                                <div style="font-size:13px; color:#64748b; margin-bottom:16px;">Sử dụng app MoMo để quét mã bên dưới</div>
                                <div style="display:inline-block; padding:12px; background:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(174,32,112,0.2);">
                                    <img id="momo-qr-img" src="" alt="MoMo QR Code" style="width:200px; height:200px; display:block;">
                                </div>
                                <div id="momo-qr-amount" style="margin-top:14px; font-size:20px; font-weight:700; color:#ae2070;"></div>
                                <div style="margin-top:6px; font-size:13px; color:#64748b;">Nội dung: <strong id="momo-qr-info">DatHang MyShop</strong></div>
                                <div style="margin-top:16px; padding:10px; background:rgba(174,32,112,0.08); border-radius:8px; font-size:13px; color:#be185d;">
                                    ⚠️ Sau khi chuyển tiền thành công, nhấn <strong>"Xác nhận đã thanh toán"</strong> bên dưới
                                </div>
                            </div>
                        </form>
                    </div>

                    <div style="flex: 1; min-width: 300px; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 90px;">
                        <h3 style="margin-bottom: 20px; font-size: 18px; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Tóm tắt đơn hàng</h3>
                        
                        <div id="checkout-items-list">
                            ${this.cart.items.map(i => `
                                <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9;">
                                    <img src="${i.image_url || 'https://placehold.co/50x50/f5f5fa/999?text=SP'}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0; margin-right: 15px;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 5px;">${i.name}</div>
                                        <div style="font-size: 13px; color: #64748b;">SL: ${i.quantity} &nbsp;|&nbsp; <strong style="color: #333;">${Number(i.subtotal).toLocaleString('vi-VN')} đ</strong></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569;">
                                <span>Tạm tính (<span id="total-qty">${this.cart.itemCount}</span> sp):</span>
                                <span id="checkout-subtotal">${Number(this.cart.total).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div id="checkout-discount-row" style="display: none; justify-content: space-between; margin-bottom: 10px; color: #10b981;">
                                <span>Giảm giá:</span>
                                <span id="checkout-discount-amt">-0 đ</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569;">
                                <span>Phí vận chuyển:</span>
                                <span>Miễn phí</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 18px; font-weight: bold; color: #c92127;">
                                <span>Tổng thanh toán:</span>
                                <span id="checkout-final">${Number(this.cart.total).toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        <button type="button" id="btn-submit-order" onclick="CustomerCheckoutPage.placeOrder()" style="width: 100%; background-color: #c92127; color: #fff; border: none; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 25px; transition: background 0.3s;">TIẾN HÀNH ĐẶT HÀNG</button>
                    </div>
                </div>
            </div>
        `;
    },

    selectPayment(method) {
        this.paymentMethod = method;
        const codLabel = document.getElementById('pay-cod-label');
        const momoLabel = document.getElementById('pay-momo-label');
        const momoSection = document.getElementById('momo-qr-section');
        const btn = document.getElementById('btn-submit-order');

        if (method === 'momo') {
            codLabel.style.border = '2px solid #e2e8f0';
            codLabel.style.background = '#fff';
            momoLabel.style.border = '2px solid #ae2070';
            momoLabel.style.background = '#fff0f7';
            momoSection.style.display = 'block';
            btn.textContent = '✅ XÁC NHẬN ĐÃ THANH TOÁN MOMO';
            btn.style.backgroundColor = '#ae2070';
            this.updateMomoQR();
        } else {
            codLabel.style.border = '2px solid #6366f1';
            codLabel.style.background = '#f0f0ff';
            momoLabel.style.border = '2px solid #e2e8f0';
            momoLabel.style.background = '#fff';
            momoSection.style.display = 'none';
            btn.textContent = 'TIẾN HÀNH ĐẶT HÀNG';
            btn.style.backgroundColor = '#c92127';
        }
    },

    updateMomoQR() {
        const subtotal = this.cart.total;
        const discountAmt = this.appliedDiscount ? this.appliedDiscount.discountAmount : 0;
        const finalAmount = Math.round(subtotal - discountAmt);
        const info = encodeURIComponent(`DatHang MyShop`);
        // VietQR API miễn phí - dùng số điện thoại MoMo giả định
        const qrUrl = `https://img.vietqr.io/image/momo-970562-0123456789.jpg?amount=${finalAmount}&addInfo=${info}&accountName=MyShop`;
        const imgEl = document.getElementById('momo-qr-img');
        const amtEl = document.getElementById('momo-qr-amount');
        if (imgEl) imgEl.src = qrUrl;
        if (amtEl) amtEl.textContent = `${Number(finalAmount).toLocaleString('vi-VN')} đ`;
    },

    updateTotals() {
        const subtotal = this.cart.total;
        const discountAmt = this.appliedDiscount ? this.appliedDiscount.discountAmount : 0;
        const final = subtotal - discountAmt;
        document.getElementById('checkout-subtotal').textContent = Number(subtotal).toLocaleString('vi-VN') + ' đ';
        document.getElementById('checkout-final').textContent = Number(final).toLocaleString('vi-VN') + ' đ';
        if (discountAmt > 0) {
            document.getElementById('checkout-discount-row').style.display = 'flex';
            document.getElementById('checkout-discount-amt').textContent = '-' + Number(discountAmt).toLocaleString('vi-VN') + ' đ';
        } else {
            document.getElementById('checkout-discount-row').style.display = 'none';
        }
        // Cập nhật QR nếu đang chọn MoMo
        if (this.paymentMethod === 'momo') this.updateMomoQR();
    },

    async applyDiscount() {
        const code = document.getElementById('discount-code').value.trim();
        if (!code) return;
        const msg = document.getElementById('discount-msg');
        try {
            const data = await App.api('/discounts/validate', {
                method: 'POST',
                body: JSON.stringify({ code, orderAmount: this.cart.total })
            });
            this.appliedDiscount = data;
            msg.textContent = `✅ Áp dụng thành công: ${data.discount.name}`;
            msg.style.color = '#10b981';
            this.updateTotals();
        } catch (err) {
            msg.textContent = '❌ ' + err.message;
            msg.style.color = '#ef4444';
            this.appliedDiscount = null;
            this.updateTotals();
        }
    },

    async placeOrder() {
        const name = document.getElementById('ship-name').value.trim();
        const phone = document.getElementById('ship-phone').value.trim();
        const address = document.getElementById('ship-address').value.trim();

        if (!name || !phone || !address) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        const btn = document.getElementById('btn-submit-order');
        btn.disabled = true;
        btn.innerText = 'ĐANG XỬ LÝ...';
        btn.style.backgroundColor = '#94a3b8';

        try {
            const body = {
                shipping_name: name,
                shipping_phone: phone,
                shipping_address: address,
                payment_method: this.paymentMethod,
                discount_code: this.appliedDiscount ? document.getElementById('discount-code').value : undefined
            };
            await App.api('/shop/checkout', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (this.paymentMethod === 'momo') {
                App.toast('🎉 Xác nhận thanh toán MoMo thành công! Đơn hàng của bạn đã được tạo.', 'success');
            } else {
                App.toast('🎉 Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận.', 'success');
            }

            if (typeof ShopBrowsePage !== 'undefined') ShopBrowsePage.updateCartBadge();
            setTimeout(() => {
                App.navigate('my-orders');
            }, 1500);
        } catch (err) {
            App.toast('❌ Lỗi: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerText = this.paymentMethod === 'momo' ? '✅ XÁC NHẬN ĐÃ THANH TOÁN MOMO' : 'TIẾN HÀNH ĐẶT HÀNG';
            btn.style.backgroundColor = this.paymentMethod === 'momo' ? '#ae2070' : '#c92127';
        }
    }
};
