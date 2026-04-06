/* ======================================
   CUSTOMER ORDERS PAGE
   Style giống Web_DACN/orders.html
   ====================================== */
const CustomerOrdersPage = {
    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            const orders = await App.api('/shop/my-orders');
            this.renderOrders(orders);
        } catch (err) {
            content.innerHTML = '<div style="text-align:center; padding: 50px;"><p>Lỗi tải đơn hàng</p></div>';
        }
    },

    renderOrders(orders) {
        const content = document.getElementById('content-area');
        if (!orders || !orders.length) {
            content.innerHTML = `
                <div style="max-width: 1000px; margin: 40px auto; padding: 0 20px;">
                    <h1 style="font-size: 26px; margin-bottom: 30px; color: #1e293b; text-align: center;">📋 Lịch sử mua hàng</h1>
                    <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        <h3 style="margin-bottom: 20px; color: #475569; font-size: 20px;">Bạn chưa có đơn hàng nào</h3>
                        <button onclick="App.navigate('shop')" style="border:none; cursor:pointer; padding: 12px 25px; background: #c92127; color: white; border-radius: 6px; font-weight: bold; display: inline-block;">Mua sắm ngay</button>
                    </div>
                </div>
            `;
            return;
        }

        const statusMap = { pending: '⏳ Chờ xử lý', completed: '✅ Hoàn thành', cancelled: '❌ Đã huỷ' };

        content.innerHTML = `
            <div style="max-width: 1000px; margin: 40px auto; padding: 0 20px;">
                <h1 style="font-size: 26px; margin-bottom: 30px; color: #1e293b; text-align: center;">📋 Lịch sử mua hàng</h1>
                <div class="orders-list">
                    ${orders.map(o => {
                        let statusColor = o.status === 'cancelled' ? '#dc2626' : (o.status === 'completed' ? '#16a34a' : '#d97706');
                        let statusBg = o.status === 'cancelled' ? '#fee2e2' : (o.status === 'completed' ? '#dcfce7' : '#fef3c7');

                        return `
                            <div style="background: #fff; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; transition: transform 0.3s ease;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                                    <span style="font-weight: bold; color: #334155; font-size: 16px;">Mã đơn: #${o.id}</span>
                                    <span style="color: ${statusColor}; font-weight: 600; background: ${statusBg}; padding: 6px 15px; border-radius: 20px; font-size: 13px;">${statusMap[o.status] || o.status}</span>
                                </div>
                                
                                <div style="color: #475569; font-size: 15px; margin-bottom: 20px; line-height: 1.6;">
                                    <div style="margin-bottom: 8px;">📅 <strong>Ngày đặt:</strong> ${App.formatDateTime(o.created_at)}</div>
                                    <div style="margin-bottom: 8px;">📦 <strong>Sản phẩm:</strong> ${o.item_count} món</div>
                                    <div style="margin-bottom: 8px;">💳 <strong>Thanh toán:</strong> 
                                        ${o.payment_method === 'momo' 
                                            ? '<span style="background:#fce4ef;color:#ae2070;padding:2px 10px;border-radius:12px;font-weight:600;font-size:13px;">MoMo QR</span>'
                                            : '<span style="background:#f0f0ff;color:#6366f1;padding:2px 10px;border-radius:12px;font-weight:600;font-size:13px;">Tiền mặt (COD)</span>'
                                        }
                                    </div>
                                    ${o.discount_code ? `<div style="margin-bottom: 8px;">🏷️ <strong>Mã giảm giá:</strong> ${o.discount_code} (-${Number(o.discount_amount).toLocaleString('vi-VN')} đ)</div>` : ''}
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
                                    <div><button onclick="CustomerOrdersPage.viewDetail(${o.id})" style="padding: 8px 15px; background-color: #f1f5f9; color: #475569; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s;">Xem chi tiết</button></div>
                                    <div style="font-size: 16px; color: #475569; text-align: right;">
                                        Tổng thanh toán: <br><strong style="color: #c92127; font-size: 24px;">${Number(o.total).toLocaleString('vi-VN')} đ</strong>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    async viewDetail(orderId) {
        try {
            const data = await App.api(`/shop/my-orders/${orderId}`);
            const o = data.order;
            const items = data.items;
            const statusMap = { pending: '⏳ Chờ xử lý', completed: '✅ Hoàn thành', cancelled: '❌ Đã huỷ' };
            let statusColor = o.status === 'cancelled' ? '#dc2626' : (o.status === 'completed' ? '#16a34a' : '#d97706');

            App.showModal(`Chi tiết đơn hàng #${o.id}`, `
                <div style="margin-bottom:20px; font-size:15px; line-height:1.6; color:#475569;">
                    <p><strong>Trạng thái:</strong> <span style="color:${statusColor}; font-weight:600;">${statusMap[o.status] || o.status}</span></p>
                    <p><strong>Ngày đặt:</strong> ${App.formatDateTime(o.created_at)}</p>
                    <p><strong>Thanh toán:</strong> 
                        ${o.payment_method === 'momo' 
                            ? '<span style="background:#fce4ef;color:#ae2070;padding:2px 10px;border-radius:12px;font-weight:600;font-size:13px;">💜 MoMo QR</span>'
                            : '<span style="background:#f0f0ff;color:#6366f1;padding:2px 10px;border-radius:12px;font-weight:600;font-size:13px;">💵 Tiền mặt (COD)</span>'
                        }
                    </p>
                    <div style="margin-top:10px; padding:15px; background:#f8fafc; border-radius:8px;">
                        <strong>Thông tin giao hàng:</strong><br>
                        Người nhận: ${o.shipping_name || 'N/A'}<br>
                        SĐT: ${o.shipping_phone || 'N/A'}<br>
                        Địa chỉ: ${o.shipping_address || 'N/A'}
                    </div>
                </div>
                <h4 style="margin-bottom:12px; color:#1e293b;">Danh sách sản phẩm:</h4>
                <div style="display:flex;flex-direction:column;gap:10px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                    ${items.map(i => `
                        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
                            <img src="${i.image_url || 'https://placehold.co/50x50/f5f5fa/999?text=SP'}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;">
                            <div style="flex:1;">
                                <strong style="color:#334155; font-size:14px; display:block; margin-bottom:4px;">${i.name}</strong>
                                <small style="color:#64748b;">${i.quantity} x ${Number(i.price).toLocaleString('vi-VN')} đ</small>
                            </div>
                            <span style="font-weight:600; color:#333;">${Number(i.quantity * i.price).toLocaleString('vi-VN')} đ</span>
                        </div>
                    `).join('')}
                </div>
                <div style="border-top:2px dashed #cbd5e1; margin-top:20px; padding-top:16px; text-align:right; font-size:16px; color:#475569;">
                    ${o.discount_amount > 0 ? `<p style="color:#10b981; margin-bottom:5px;">Giảm giá: -${Number(o.discount_amount).toLocaleString('vi-VN')} đ</p>` : ''}
                    <div style="margin-top: 10px;">Tổng tiền: <strong style="color:#c92127; font-size:22px; margin-left:10px;">${Number(o.total).toLocaleString('vi-VN')} đ</strong></div>
                </div>
            `);
        } catch (err) {
            App.toast('Lỗi tải chi tiết đơn hàng', 'error');
        }
    }
};
