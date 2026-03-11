/* Discounts Management Page */
const DiscountsPage = {
    discounts: [],

    async render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="table-toolbar">
                <button class="btn btn-primary" id="add-discount-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Tạo mã Khuyến mãi
                </button>
            </div>
            <div id="discounts-content">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        `;

        document.getElementById('add-discount-btn').addEventListener('click', () => this.showDiscountForm());
        await this.loadDiscounts();
    },

    async loadDiscounts() {
        try {
            this.discounts = await App.api('/discounts');
            this.renderTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderTable() {
        const container = document.getElementById('discounts-content');
        if (this.discounts.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Chưa có mã khuyến mãi nào</p></div>`;
            return;
        }

        const getStatusBadge = (s) => {
            const map = { active: 'bg-green-500/20 text-green-500', inactive: 'bg-gray-500/20 text-gray-500', expired: 'bg-red-500/20 text-red-500' };
            const labels = { active: 'Đang chạy', inactive: 'Tạm dừng', expired: 'Hết hạn' };
            return `<span class="px-2 py-1 rounded text-xs font-bold ${map[s] || ''}">${labels[s] || s}</span>`;
        };

        container.innerHTML = `
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
                                    <td style="font-weight:700; color:var(--primary-light)">${d.code}</td>
                                    <td>${d.name}</td>
                                    <td style="font-weight:600">${valStr}</td>
                                    <td style="font-size:0.85em; color:var(--text-muted)">${dates}</td>
                                    <td>${usage}</td>
                                    <td>${getStatusBadge(d.status)}</td>
                                    <td>
                                        ${d.status === 'active' 
                                            ? `<button class="btn btn-sm btn-outline" style="border-color:var(--warning); color:var(--warning)" onclick="DiscountsPage.toggleStatus(${d.id}, 'inactive')">Dừng</button>` 
                                            : `<button class="btn btn-sm btn-outline" style="border-color:var(--success); color:var(--success)" onclick="DiscountsPage.toggleStatus(${d.id}, 'active')">Kích hoạt</button>`
                                        }
                                        <button class="btn btn-sm btn-danger" onclick="DiscountsPage.deleteRecord(${d.id})">Xóa</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showDiscountForm() {
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
                await this.loadDiscounts();
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
            await this.loadDiscounts();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    async deleteRecord(id) {
        if (!confirm('Bạn có chắc muốn xóa mã khuyến mãi này?')) return;
        try {
            await App.api(`/discounts/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa mã', 'success');
            await this.loadDiscounts();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.DiscountsPage = DiscountsPage;
