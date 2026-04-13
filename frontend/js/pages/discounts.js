/* Discounts Management Page - 2 tabs: Mã khuyến mãi & Giảm giá sản phẩm */
const DiscountsPage = {
    discounts: [],
    productDiscounts: [],
    allProducts: [],
    activeTab: 'coupons',

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="card" style="margin-bottom:20px;">
                <div style="display:flex; gap:8px; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
                    <button class="btn ${this.activeTab === 'coupons' ? 'btn-primary' : 'btn-secondary'}" id="tab-coupons" onclick="DiscountsPage.switchTab('coupons')">🎫 Mã Khuyến mãi</button>
                    <button class="btn ${this.activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}" id="tab-products" onclick="DiscountsPage.switchTab('products')">🏷️ Giảm giá Sản phẩm</button>
                </div>
                <div id="discount-tab-content">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        if (this.activeTab === 'coupons') {
            await this.loadCoupons();
        } else {
            await this.loadProductDiscounts();
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    // ============ TAB 1: MÃ KHUYẾN MÃI (COUPONS) ============
    async loadCoupons() {
        try {
            this.discounts = await App.api('/discounts');
            this.renderCouponsTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderCouponsTable() {
        const container = document.getElementById('discount-tab-content');
        
        const toolbar = `<div class="table-toolbar" style="margin-bottom:16px;">
            <button class="btn btn-primary" onclick="DiscountsPage.showCouponForm()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tạo mã Khuyến mãi
            </button>
        </div>`;

        if (this.discounts.length === 0) {
            container.innerHTML = toolbar + `<div class="empty-state"><p>Chưa có mã khuyến mãi nào</p></div>`;
            return;
        }

        const getStatusBadge = (s) => {
            const colors = { active: 'var(--success)', inactive: 'var(--text-muted)', expired: 'var(--danger)' };
            const labels = { active: 'Đang chạy', inactive: 'Tạm dừng', expired: 'Hết hạn' };
            return `<span style="color:${colors[s] || '#999'}; font-weight:600; font-size:0.85em">${labels[s] || s}</span>`;
        };

        container.innerHTML = toolbar + `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Mã CODE</th>
                            <th>Tên CTKM</th>
                            <th>Ưu đãi</th>
                            <th>Hạn dùng</th>
                            <th>Lượt dùng</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.discounts.map(d => {
                            const valStr = d.type === 'percentage' ? `-${d.value}%` : `-${App.formatCurrency(d.value)}`;
                            const dates = `${App.formatDate(d.start_date)} - ${App.formatDate(d.end_date)}`;
                            const usage = d.usage_limit ? `${d.used_count}/${d.usage_limit}` : `${d.used_count}/∞`;
                            
                            return `
                                <tr>
                                    <td style="font-weight:700; color:var(--accent-primary)">${d.code}</td>
                                    <td>${d.name}</td>
                                    <td style="font-weight:600">${valStr}</td>
                                    <td style="font-size:0.85em; color:var(--text-muted)">${dates}</td>
                                    <td>${usage}</td>
                                    <td>${getStatusBadge(d.status)}</td>
                                    <td>
                                        ${d.status === 'active' 
                                            ? `<button class="btn btn-sm btn-secondary" onclick="DiscountsPage.toggleStatus(${d.id}, 'inactive')">Dừng</button>` 
                                            : `<button class="btn btn-sm btn-success" onclick="DiscountsPage.toggleStatus(${d.id}, 'active')">Kích hoạt</button>`
                                        }
                                        <button class="btn btn-sm btn-danger" onclick="DiscountsPage.deleteCoupon(${d.id})">Xóa</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showCouponForm() {
        const today = new Date().toISOString().split('T')[0];
        
        App.showModal('Tạo Mã Khuyến Mãi', `
            <form id="df-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Mã CODE (Ví dụ: TET2025) *</label>
                    <input type="text" id="df-code" required style="text-transform: uppercase;">
                </div>
                <div class="form-group">
                    <label>Tên chương trình *</label>
                    <input type="text" id="df-name" required placeholder="Khuyến mãi Tết Nguyên Đán">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Loại giảm giá</label>
                        <select id="df-type">
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixed">Tiền mặt (VNĐ)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Giá trị *</label>
                        <input type="number" id="df-value" required min="1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Từ ngày *</label>
                        <input type="date" id="df-start" required value="${today}">
                    </div>
                    <div class="form-group">
                        <label>Đến ngày *</label>
                        <input type="date" id="df-end" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Giới hạn số lần dùng (để trống = Không giới hạn)</label>
                        <input type="number" id="df-limit" min="1">
                    </div>
                    <div class="form-group">
                        <label>Đơn tối thiểu (VNĐ)</label>
                        <input type="number" id="df-min" value="0" min="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Tạo mới</button>
                </div>
            </form>
        `);

        document.getElementById('df-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                code: document.getElementById('df-code').value.toUpperCase(),
                name: document.getElementById('df-name').value,
                type: document.getElementById('df-type').value,
                value: parseFloat(document.getElementById('df-value').value),
                start_date: document.getElementById('df-start').value,
                end_date: document.getElementById('df-end').value,
                usage_limit: document.getElementById('df-limit').value ? parseInt(document.getElementById('df-limit').value) : null,
                min_purchase: document.getElementById('df-min').value ? parseFloat(document.getElementById('df-min').value) : 0,
                status: 'active'
            };

            try {
                await App.api('/discounts', { method: 'POST', body: JSON.stringify(data) });
                App.toast('Tạo mã thành công!', 'success');
                App.closeModal();
                await this.loadCoupons();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async toggleStatus(id, newStatus) {
        try {
            await App.api(`/discounts/${id}/status`, { 
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            App.toast('Đã cập nhật trạng thái', 'success');
            await this.loadCoupons();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    async deleteCoupon(id) {
        if (!confirm('Bạn có chắc muốn xóa mã khuyến mãi này?')) return;
        try {
            await App.api(`/discounts/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa mã', 'success');
            await this.loadCoupons();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    // ============ TAB 2: GIẢM GIÁ SẢN PHẨM ============
    async loadProductDiscounts() {
        try {
            const [pds, products] = await Promise.all([
                App.api('/discounts/products'),
                App.api('/products')
            ]);
            this.productDiscounts = pds;
            this.allProducts = products;
            this.renderProductDiscountsTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderProductDiscountsTable() {
        const container = document.getElementById('discount-tab-content');

        const toolbar = `<div class="table-toolbar" style="margin-bottom:16px;">
            <button class="btn btn-primary" onclick="DiscountsPage.showProductDiscountForm()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm giảm giá cho sản phẩm
            </button>
        </div>`;

        if (this.productDiscounts.length === 0) {
            container.innerHTML = toolbar + `<div class="empty-state"><p>Chưa có sản phẩm nào được giảm giá</p></div>`;
            return;
        }

        container.innerHTML = toolbar + `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Giảm giá</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.productDiscounts.map(pd => {
                            const now = new Date();
                            const start = new Date(pd.start_date);
                            const end = new Date(pd.end_date);
                            const isActive = now >= start && now <= end;
                            const statusLabel = isActive ? '<span style="color:var(--success); font-weight:600">Đang áp dụng</span>' : '<span style="color:var(--text-muted); font-weight:600">Hết hạn</span>';
                            
                            return `
                                <tr>
                                    <td style="font-weight:600">${pd.product_name || 'Sản phẩm #' + pd.product_id}</td>
                                    <td style="color:var(--danger); font-weight:700; font-size:1.1em">-${pd.discount_percentage}%</td>
                                    <td>${App.formatDate(pd.start_date)}</td>
                                    <td>${App.formatDate(pd.end_date)}</td>
                                    <td>${statusLabel}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="DiscountsPage.deleteProductDiscount(${pd.id})">Xóa</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showProductDiscountForm() {
        const today = new Date().toISOString().split('T')[0];
        const productOptions = this.allProducts.map(p => 
            `<option value="${p.id}">${p.name} (${Number(p.price).toLocaleString('vi-VN')}đ)</option>`
        ).join('');

        App.showModal('Thêm Giảm Giá Sản Phẩm', `
            <form id="pd-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Chọn sản phẩm *</label>
                    <select id="pd-product" required>
                        <option value="">-- Chọn sản phẩm --</option>
                        ${productOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Phần trăm giảm giá (%) *</label>
                    <input type="number" id="pd-percent" required min="1" max="90" placeholder="Ví dụ: 10">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Từ ngày *</label>
                        <input type="date" id="pd-start" required value="${today}">
                    </div>
                    <div class="form-group">
                        <label>Đến ngày *</label>
                        <input type="date" id="pd-end" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Áp dụng</button>
                </div>
            </form>
        `);

        document.getElementById('pd-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                product_id: parseInt(document.getElementById('pd-product').value),
                discount_percentage: parseFloat(document.getElementById('pd-percent').value),
                start_date: document.getElementById('pd-start').value,
                end_date: document.getElementById('pd-end').value
            };

            if (!data.product_id) {
                App.toast('Vui lòng chọn sản phẩm', 'error');
                return;
            }

            try {
                await App.api('/discounts/products', { method: 'POST', body: JSON.stringify(data) });
                App.toast('Đã áp dụng giảm giá!', 'success');
                App.closeModal();
                await this.loadProductDiscounts();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async deleteProductDiscount(id) {
        if (!confirm('Bạn có chắc muốn xóa giảm giá này?')) return;
        try {
            await App.api(`/discounts/products/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa giảm giá', 'success');
            await this.loadProductDiscounts();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.DiscountsPage = DiscountsPage;
