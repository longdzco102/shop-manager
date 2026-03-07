/* Expenses Page */
const ExpensesPage = {
    async render() {
        const content = document.getElementById('content-area');
        const isAdmin = App.user.role === 'admin';

        content.innerHTML = `
            <div class="table-toolbar">
                <div class="search-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="expense-search" placeholder="Tìm chi phí...">
                </div>
                <button class="btn btn-primary" id="add-expense-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Thêm chi phí
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>ID</th><th>Tiêu đề</th><th>Số tiền</th><th>Danh mục</th><th>Ngày</th><th>Người tạo</th>${isAdmin ? '<th>Hành động</th>' : ''}
                    </tr></thead>
                    <tbody id="expenses-tbody">
                        <tr><td colspan="7"><div class="loading"><div class="spinner"></div></div></td></tr>
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('add-expense-btn').addEventListener('click', () => this.showExpenseForm());
        document.getElementById('expense-search').addEventListener('input', (e) => this.loadExpenses(e.target.value));

        await this.loadExpenses();
    },

    async loadExpenses(search = '') {
        try {
            const expenses = await App.api('/expenses');
            const tbody = document.getElementById('expenses-tbody');
            if (!tbody) return;

            let filtered = expenses;
            if (search) {
                filtered = expenses.filter(e =>
                    e.title.toLowerCase().includes(search.toLowerCase()) ||
                    (e.category && e.category.toLowerCase().includes(search.toLowerCase()))
                );
            }

            const isAdmin = App.user.role === 'admin';

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Không có chi phí</p></div></td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(e => `
                <tr>
                    <td>#${e.id}</td>
                    <td style="font-weight:500;color:var(--text-primary)">${e.title}</td>
                    <td style="color:var(--danger);font-weight:600">${App.formatCurrency(e.amount)}</td>
                    <td><span class="status-badge" style="background:rgba(139,92,246,0.1);color:var(--accent-secondary)">${e.category || 'Khác'}</span></td>
                    <td>${App.formatDate(e.date)}</td>
                    <td>${e.full_name || e.username}</td>
                    ${isAdmin ? `<td><button class="btn btn-sm btn-danger" onclick="ExpensesPage.deleteExpense(${e.id})">Xóa</button></td>` : ''}
                </tr>
            `).join('');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    showExpenseForm() {
        const today = new Date().toISOString().split('T')[0];
        App.showModal('Thêm chi phí', `
            <form id="expense-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Tiêu đề *</label>
                    <input type="text" id="ef-title" placeholder="Ví dụ: Tiền điện, Tiền thuê..." required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Số tiền (VND) *</label>
                        <input type="number" id="ef-amount" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Ngày *</label>
                        <input type="date" id="ef-date" value="${today}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Danh mục</label>
                    <select id="ef-category">
                        <option value="">-- Chọn danh mục --</option>
                        <option value="Tiền thuê">Tiền thuê</option>
                        <option value="Tiện ích">Tiện ích</option>
                        <option value="Lương">Lương</option>
                        <option value="Hàng hóa">Hàng hóa</option>
                        <option value="Vận chuyển">Vận chuyển</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Bảo trì">Bảo trì</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Thêm</button>
                </div>
            </form>
        `);

        document.getElementById('expense-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                title: document.getElementById('ef-title').value,
                amount: parseFloat(document.getElementById('ef-amount').value),
                date: document.getElementById('ef-date').value,
                category: document.getElementById('ef-category').value
            };
            try {
                await App.api('/expenses', { method: 'POST', body: JSON.stringify(data) });
                App.toast('Thêm chi phí thành công!', 'success');
                App.closeModal();
                await this.loadExpenses();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async deleteExpense(id) {
        if (!confirm('Bạn có chắc muốn xóa chi phí này?')) return;
        try {
            await App.api(`/expenses/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa chi phí!', 'success');
            await this.loadExpenses();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.ExpensesPage = ExpensesPage;
