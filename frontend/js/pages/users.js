/* Users Page (Admin Only) */
const UsersPage = {
    async render() {
        if (App.user.role !== 'admin') {
            document.getElementById('content-area').innerHTML = '<div class="form-error">Bạn không có quyền truy cập trang này.</div>';
            return;
        }

        const content = document.getElementById('content-area');
        content.innerHTML = `
            <div class="table-toolbar">
                <div class="card-title">Danh sách nhân viên</div>
                <button class="btn btn-primary" id="add-user-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    Thêm nhân viên
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>ID</th><th>Username</th><th>Họ tên</th><th>Vai trò</th><th>Ngày tạo</th><th>Hành động</th>
                    </tr></thead>
                    <tbody id="users-tbody">
                        <tr><td colspan="6"><div class="loading"><div class="spinner"></div></div></td></tr>
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('add-user-btn').addEventListener('click', () => this.showUserForm());
        await this.loadUsers();
    },

    async loadUsers() {
        try {
            const users = await App.api('/users');
            const tbody = document.getElementById('users-tbody');
            if (!tbody) return;

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>#${u.id}</td>
                    <td style="font-weight:500;color:var(--text-primary)">${u.username}</td>
                    <td>${u.full_name || '-'}</td>
                    <td><span class="badge" style="${u.role === 'admin' ? 'background:rgba(239,68,68,0.1);color:var(--danger);border-color:rgba(239,68,68,0.2)' : ''}">${u.role}</span></td>
                    <td>${App.formatDate(u.created_at)}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-secondary" onclick="UsersPage.showUserForm(${u.id})">Sửa</button>
                            ${u.id !== App.user.id ? `<button class="btn btn-sm btn-danger" onclick="UsersPage.deleteUser(${u.id})">Xóa</button>` : '<span style="color:var(--text-muted)">Bạn</span>'}
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    showUserForm(userId = null) {
        const user = userId ? this.users.find(u => u.id === userId) : null;
        const title = user ? 'Sửa nhân viên' : 'Thêm nhân viên';

        App.showModal(title, `
            <form id="user-form" onsubmit="return false;">
                ${!user ? `
                <div class="form-group">
                    <label>Username *</label>
                    <input type="text" id="uf-username" placeholder="Tên đăng nhập" required>
                </div>
                <div class="form-group">
                    <label>Mật khẩu *</label>
                    <input type="password" id="uf-password" placeholder="Nhập mật khẩu" required>
                </div>
                ` : `<div class="form-group" style="color:var(--text-muted)">Đang sửa: <strong>${user.username}</strong></div>`}
                
                <div class="form-group">
                    <label>Họ tên</label>
                    <input type="text" id="uf-fullname" placeholder="Họ và tên" value="${user ? (user.full_name || '') : ''}">
                </div>
                
                <div class="form-group">
                    <label>Vai trò</label>
                    <select id="uf-role">
                        <option value="staff" ${user && user.role === 'staff' ? 'selected' : ''}>Staff (Nhân viên)</option>
                        <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>

                <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
                <div style="font-weight:600;margin-bottom:12px">Mức lương (VND)</div>
                
                <div class="form-group">
                    <label>Lương cơ bản / Tháng</label>
                    <input type="number" id="uf-base-salary" value="${user ? (user.base_salary || 0) : 0}">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Lương theo giờ</label>
                        <input type="number" id="uf-hourly" value="${user ? (user.hourly_rate || 25000) : 25000}">
                    </div>
                    <div class="form-group">
                        <label>Lương tăng ca (1h)</label>
                        <input type="number" id="uf-overtime" value="${user ? (user.overtime_rate || 37500) : 37500}">
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">${user ? 'Cập nhật' : 'Tạo mới'}</button>
                </div>
            </form>
        `);

        document.getElementById('user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                full_name: document.getElementById('uf-fullname').value,
                role: document.getElementById('uf-role').value,
                base_salary: parseFloat(document.getElementById('uf-base-salary').value) || 0,
                hourly_rate: parseFloat(document.getElementById('uf-hourly').value) || 0,
                overtime_rate: parseFloat(document.getElementById('uf-overtime').value) || 0
            };

            try {
                if (user) {
                    await App.api(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(data) });
                    App.toast('Cập nhật thành công!', 'success');
                } else {
                    data.username = document.getElementById('uf-username').value;
                    data.password = document.getElementById('uf-password').value;
                    await App.api('/auth/register', { method: 'POST', body: JSON.stringify(data) });
                    App.toast('Tạo nhân viên thành công!', 'success');
                }

                App.closeModal();
                await this.loadUsers();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async deleteUser(id) {
        if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
        try {
            await App.api(`/users/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa nhân viên!', 'success');
            await this.loadUsers();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.UsersPage = UsersPage;
