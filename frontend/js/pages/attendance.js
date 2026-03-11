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
                <button class="btn btn-primary" id="add-att-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ${isAdmin ? 'Chấm công nhân viên' : 'Nhập ca làm'}</button>
            </div>
            <div id="att-content">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        `;

        document.getElementById('att-month').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.switchTab(this.activeTab);
        });

        document.getElementById('add-att-btn').addEventListener('click', () => this.showAttendanceForm());

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
                        <th>Nhân viên</th><th>Ngày làm</th><th>Giờ làm</th><th>Tăng ca</th><th>Ghi chú</th>${isAdmin ? '<th>Hành động</th>' : ''}
                    </tr></thead>
                    <tbody>
                        ${this.records.map(r => `
                            <tr>
                                <td style="font-weight:500;color:var(--text-primary)">${r.full_name || r.username}</td>
                                <td>${App.formatDate(r.work_date)}</td>
                                <td style="font-weight:600">${r.hours_worked}h</td>
                                <td style="color:${r.overtime_hours > 0 ? 'var(--warning)' : 'var(--text-muted)'}; font-weight:600">${r.overtime_hours > 0 ? r.overtime_hours + 'h' : '-'}</td>
                                <td>${r.note || '-'}</td>
                                ${isAdmin ? `<td>
                                    <button class="btn btn-sm btn-outline" style="padding:4px 8px; font-size:12px; border-color:var(--primary); color:var(--primary)" onclick="AttendancePage.showAttendanceForm(${r.id})">Sửa</button>
                                    <button class="btn btn-sm btn-danger" style="padding:4px 8px; font-size:12px;" onclick="AttendancePage.deleteRecord(${r.id})">Xóa</button>
                                </td>` : ''}
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

    showAttendanceForm(editId = null) {
        const isAdmin = App.user.role === 'admin';
        const staffOnly = this.users.filter(u => u.role !== 'admin');
        const today = new Date().toISOString().split('T')[0];
        
        let record = null;
        if (editId) {
            record = this.records.find(r => r.id === editId);
        }
        
        const userOptions = isAdmin 
            ? `<option value="">-- Chọn nhân viên --</option>` + staffOnly.map(u => `<option value="${u.id}" ${record && record.user_id === u.id ? 'selected' : ''}>${u.full_name || u.username}</option>`).join('')
            : `<option value="${App.user.id}" selected>${App.user.full_name || App.user.username}</option>`;

        App.showModal(editId ? 'Sửa ca làm' : (isAdmin ? 'Chấm công nhân viên' : 'Nhập ca làm'), `
            <form id="att-form" onsubmit="return false;">
                <input type="hidden" id="af-id" value="${editId || ''}">
                <div class="form-group" ${!isAdmin ? 'style="display:none;"' : ''}>
                    <label>Nhân viên *</label>
                    <select id="af-user" required ${!isAdmin || editId ? 'disabled' : ''}>
                        ${userOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Ngày làm *</label>
                    <input type="date" id="af-date" value="${record ? record.work_date.split('T')[0] : today}" required ${editId ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label>Ca làm (Shift) *</label>
                    <select id="af-shift" required onchange="AttendancePage.handleShiftChange()">
                        <option value="4|Ca sáng (08:00 - 12:00)">Ca sáng (08:00 - 12:00) [4h]</option>
                        <option value="4|Ca chiều (13:00 - 17:00)">Ca chiều (13:00 - 17:00) [4h]</option>
                        <option value="4|Ca tối (18:00 - 22:00)">Ca tối (18:00 - 22:00) [4h]</option>
                        <option value="8|Ca hành chính (08:00 - 17:00)" ${!record ? 'selected' : ''}>Ca hành chính (08:00 - 17:00) [8h]</option>
                        <option value="custom|Tùy chỉnh" ${record ? 'selected' : ''}>Tùy chỉnh (Nhập giờ thủ công, Nghỉ làm)</option>
                    </select>
                </div>
                <div id="custom-hours-group" style="display:${record ? 'block' : 'none'};">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Giờ làm chính (h) [Nhập 0 nếu nghỉ]</label>
                            <input type="number" id="af-hours" value="${record ? record.hours_worked : 8}" min="0" max="24" step="0.5">
                        </div>
                        <div class="form-group">
                            <label>Giờ tăng ca (h)</label>
                            <input type="number" id="af-overtime" value="${record ? record.overtime_hours : 0}" min="0" max="12" step="0.5">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Ghi chú thêm</label>
                    <input type="text" id="af-note" value="${record ? record.note : ''}" placeholder="Ví dụ: Đi trễ, Nghỉ phép...">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Lưu</button>
                </div>
            </form>
        `);

        document.getElementById('att-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const shiftVal = document.getElementById('af-shift').value;
            let hoursWorked = 0;
            let overtimeHours = 0;
            let notePrefix = '';
            
            if (shiftVal.startsWith('custom')) {
                hoursWorked = parseFloat(document.getElementById('af-hours').value) || 0;
                overtimeHours = parseFloat(document.getElementById('af-overtime').value) || 0;
                if (!record) notePrefix = hoursWorked === 0 ? 'Nghỉ làm' : 'Ca tùy chỉnh';
            } else {
                const parts = shiftVal.split('|');
                hoursWorked = parseFloat(parts[0]);
                if (!record) notePrefix = parts[1];
            }
            
            const customNote = document.getElementById('af-note').value;
            const finalNote = record ? customNote : (customNote && notePrefix ? `${notePrefix} - ${customNote}` : (customNote || notePrefix));

            const id = document.getElementById('af-id').value;
            const data = {
                user_id: isAdmin ? parseInt(document.getElementById('af-user').value) : App.user.id,
                work_date: document.getElementById('af-date').value,
                hours_worked: hoursWorked,
                overtime_hours: overtimeHours,
                note: finalNote
            };

            try {
                if (id) {
                    await App.api(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
                    App.toast('Cập nhật ca làm thành công!', 'success');
                } else {
                    await App.api('/attendance', { method: 'POST', body: JSON.stringify(data) });
                    App.toast('Nhập ca làm thành công!', 'success');
                }
                App.closeModal();
                await this.loadAttendance();
            } catch (err) {
                App.toast(err.message, 'error');
            }
        });
    },

    handleShiftChange() {
        const val = document.getElementById('af-shift').value;
        const group = document.getElementById('custom-hours-group');
        if (val.startsWith('custom')) {
            group.style.display = 'block';
        } else {
            group.style.display = 'none';
        }
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
