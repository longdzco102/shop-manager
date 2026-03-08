/* Procurements Page (Nhập hàng) */
const ProcurementsPage = {
    procurements: [],
    products: [],

    async render() {
        const content = document.getElementById('content-area');
        const isAdmin = App.user.role === 'admin';

        content.innerHTML = `
            <div class="table-toolbar">
                <div class="search-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="proc-search" placeholder="Tìm lịch sử nhập hàng...">
                </div>
                ${isAdmin ? '<button class="btn btn-primary" id="add-proc-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nhập hàng mới</button>' : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>ID</th><th>Sản phẩm</th><th>Số lượng</th><th>Giá nhập</th><th>Nhà cung cấp</th><th>Ngày nhập</th>
                    </tr></thead>
                    <tbody id="proc-tbody">
                        <tr><td colspan="6"><div class="loading"><div class="spinner"></div></div></td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // Search locally
        document.getElementById('proc-search').addEventListener('input', (e) => {
            this.filterProcurements(e.target.value);
        });

        if (isAdmin) {
            document.getElementById('add-proc-btn').addEventListener('click', () => {
                this.showProcurementForm();
            });
        }

        await Promise.all([this.loadProcurements(), this.loadProducts()]);
    },

    async loadProcurements() {
        try {
            this.procurements = await App.api('/procurements');
            this.renderTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    async loadProducts() {
        try {
            this.products = await App.api('/products');
        } catch (err) {
            console.error('Failed to load products for form', err);
        }
    },

    filterProcurements(search) {
        const filtered = this.procurements.filter(pr =>
            pr.product_name.toLowerCase().includes(search.toLowerCase()) ||
            (pr.supplier && pr.supplier.toLowerCase().includes(search.toLowerCase()))
        );
        this.renderTable(filtered);
    },

    renderTable(data = null) {
        const items = data || this.procurements;
        const tbody = document.getElementById('proc-tbody');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>Chưa có lịch sử nhập hàng</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(pr => `
            <tr>
                <td>#${pr.id}</td>
                <td style="font-weight:500;color:var(--text-primary)">${pr.product_name}</td>
                <td style="font-weight:600">${pr.quantity}</td>
                <td style="color:var(--danger);font-weight:600">${App.formatCurrency(pr.purchase_price)}</td>
                <td>${pr.supplier || '-'}</td>
                <td>${App.formatDate(pr.procurement_date)}</td>
            </tr>
        `).join('');
    },

    showProcurementForm() {
        App.showModal('Nhập hàng mới', `
            <form id="proc-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Sản phẩm *</label>
                    <select id="pf-product-id" required>
                        <option value="">-- Chọn sản phẩm --</option>
                        ${this.products.map(p => `<option value="${p.id}">${p.name} (Tồn: ${p.stock})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Số lượng nhập *</label>
                        <input type="number" id="pf-qty" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Giá nhập mỗi đơn vị (VND) *</label>
                        <input type="number" id="pf-price" min="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nhà cung cấp</label>
                    <input type="text" id="pf-supplier" placeholder="Tên nhà cung cấp...">
                </div>
                <div class="form-group">
                    <label>Ngày nhập</label>
                    <input type="date" id="pf-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Xác nhận nhập kho</button>
                </div>
            </form>
        `);

        document.getElementById('proc-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                product_id: parseInt(document.getElementById('pf-product-id').value),
                quantity: parseInt(document.getElementById('pf-qty').value),
                purchase_price: parseFloat(document.getElementById('pf-price').value),
                supplier: document.getElementById('pf-supplier').value,
                procurement_date: document.getElementById('pf-date').value
            };

            try {
                await App.api('/procurements', { method: 'POST', body: JSON.stringify(data) });
                App.toast('Đã nhập kho thành công!', 'success');
                App.closeModal();
                await this.loadProcurements();
                this.loadProducts();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    }
};

window.ProcurementsPage = ProcurementsPage;
