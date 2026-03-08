/* Attendance & Payroll Page (Chấm công & Lương) */
const AttendancePage = {
    records: [],
    users: [],
    currentMonth: new Date().toISOString().slice(0, 7),
    activeTab: 'attendance',

    async render() {
        const content = document.getElementById('content-area');
        const isAdmin = App.user.role === 'admin';

        content.innerHTML = `
            <div class="tabs-header">
                <button class="tab-btn active" id="tab-attendance" onclick="AttendancePage.switchTab('attendance')">📋 Chấm công</button>
                <button class="tab-btn" id="tab-payroll" onclick="AttendancePage.switchTab('payroll')">💰 Bảng lương</button>
            </div>
            <div class="table-toolbar">
                <div class="form-group" style="margin-bottom:0;min-width:180px;">
                    <input type="month" id="att-month" value="${this.currentMonth}">
                </div>
                ${isAdmin ? '<button class="btn btn-primary" id="add-att-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Chấm công</button>' : ''}
            </div>
            <div id="att-content">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        `;

        document.getElementById('att-month').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.switchTab(this.activeTab);
        });

        if (isAdmin) {
            document.getElementById('add-att-btn').addEventListener('click', () => this.showAttendanceForm());
        }

        await this.loadUsers();
        this.switchTab('attendance');
    },

    async loadUsers() {
        try {
            this.users = await App.api('/users');
        } catch (err) {
            console.error('Failed to load users', err);
        }
    },

    async switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');

        if (tab === 'attendance') {
            await this.loadAttendance();
        } else {
            await this.loadPayroll();
        }
    },

    async loadAttendance() {
        try {
            this.records = await App.api(`/attendance?month=${this.currentMonth}`);
            this.renderAttendanceTable();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderAttendanceTable() {
        const container = document.getElementById('att-content');
        const isAdmin = App.user.role === 'admin';
        if (!container) return;

        if (this.records.length === 0) {
            container.innerHTML = `<div class="table-container"><table><tbody><tr><td><div class="empty-state"><p>Chưa có dữ liệu chấm công cho tháng này</p></div></td></tr></tbody></table></div>`;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>Nhân viên</th><th>Ngày làm</th><th>Giờ làm</th><th>Tăng ca</th><th>Ghi chú</th>${isAdmin ? '<th>Xóa</th>' : ''}
                    </tr></thead>
                    <tbody>
                        ${this.records.map(r => `
                            <tr>
                                <td style="font-weight:500;color:var(--text-primary)">${r.full_name || r.username}</td>
                                <td>${App.formatDate(r.work_date)}</td>
                                <td style="font-weight:600">${r.hours_worked}h</td>
                                <td style="color:${r.overtime_hours > 0 ? 'var(--warning)' : 'var(--text-muted)'}; font-weight:600">${r.overtime_hours > 0 ? r.overtime_hours + 'h' : '-'}</td>
                                <td>${r.note || '-'}</td>
                                ${isAdmin ? `<td><button class="btn btn-sm btn-danger" onclick="AttendancePage.deleteRecord(${r.id})">Xóa</button></td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async loadPayroll() {
        try {
            const payroll = await App.api(`/attendance/payroll?month=${this.currentMonth}`);
            this.renderPayrollTable(payroll);
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    renderPayrollTable(payroll) {
        const container = document.getElementById('att-content');
        if (!container) return;

        if (payroll.length === 0) {
            container.innerHTML = `<div class="table-container"><table><tbody><tr><td><div class="empty-state"><p>Không có dữ liệu lương cho tháng này</p></div></td></tr></tbody></table></div>`;
            return;
        }

        const grandTotal = payroll.reduce((s, r) => s + r.total_salary, 0);

        container.innerHTML = `
            <div class="stat-grid" style="margin-bottom:16px">
                <div class="stat-card">
                    <div class="stat-icon revenue">💰</div>
                    <div class="stat-value">${App.formatCurrency(grandTotal)}</div>
                    <div class="stat-label">Tổng chi lương tháng ${this.currentMonth}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon products">👥</div>
                    <div class="stat-value">${payroll.length}</div>
                    <div class="stat-label">Nhân viên</div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>Nhân viên</th><th>Ngày công</th><th>Tổng giờ</th><th>Tăng ca</th><th>Lương cơ bản</th><th>Lương giờ</th><th>Lương tăng ca</th><th style="color:var(--success)">Tổng lương</th>
                    </tr></thead>
                    <tbody>
                        ${payroll.map(r => `
                            <tr>
                                <td style="font-weight:500;color:var(--text-primary)">${r.full_name || r.username}</td>
                                <td style="font-weight:600">${r.total_days}</td>
                                <td>${r.total_hours}h</td>
                                <td style="color:${r.total_overtime > 0 ? 'var(--warning)' : 'var(--text-muted)'}">${r.total_overtime > 0 ? r.total_overtime + 'h' : '-'}</td>
                                <td>${App.formatCurrency(r.base_salary)}</td>
                                <td>${App.formatCurrency(r.normal_pay)}</td>
                                <td>${App.formatCurrency(r.overtime_pay)}</td>
                                <td style="color:var(--success);font-weight:700">${App.formatCurrency(r.total_salary)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background:rgba(255,255,255,0.05);font-weight:700">
                            <td>TỔNG CỘNG</td><td colspan="6"></td>
                            <td style="color:var(--success);font-size:1.05rem">${App.formatCurrency(grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    showAttendanceForm() {
        const staffOnly = this.users.filter(u => u.role !== 'admin');
        const today = new Date().toISOString().split('T')[0];

        App.showModal('Chấm công nhân viên', `
            <form id="att-form" onsubmit="return false;">
                <div class="form-group">
                    <label>Nhân viên *</label>
                    <select id="af-user" required>
                        <option value="">-- Chọn nhân viên --</option>
                        ${staffOnly.map(u => `<option value="${u.id}">${u.full_name || u.username}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Ngày làm *</label>
                    <input type="date" id="af-date" value="${today}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Giờ làm chính (h)</label>
                        <input type="number" id="af-hours" value="8" min="0" max="24" step="0.5">
                    </div>
                    <div class="form-group">
                        <label>Giờ tăng ca (h)</label>
                        <input type="number" id="af-overtime" value="0" min="0" max="12" step="0.5">
                    </div>
                </div>
                <div class="form-group">
                    <label>Ghi chú</label>
                    <input type="text" id="af-note" placeholder="Ví dụ: Ca sáng, Ca tối...">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Chấm công</button>
                </div>
            </form>
        `);

        document.getElementById('att-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                user_id: parseInt(document.getElementById('af-user').value),
                work_date: document.getElementById('af-date').value,
                hours_worked: parseFloat(document.getElementById('af-hours').value),
                overtime_hours: parseFloat(document.getElementById('af-overtime').value),
                note: document.getElementById('af-note').value
            };

            try {
                await App.api('/attendance', { method: 'POST', body: JSON.stringify(data) });
                App.toast('Chấm công thành công!', 'success');
                App.closeModal();
                await this.loadAttendance();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    async deleteRecord(id) {
        if (!confirm('Bạn có chắc muốn xóa bản chấm công này?')) return;
        try {
            await App.api(`/attendance/${id}`, { method: 'DELETE' });
            App.toast('Đã xóa!', 'success');
            await this.loadAttendance();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }
};

window.AttendancePage = AttendancePage;
