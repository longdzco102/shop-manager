/* ======================================
   SHIFT MANAGEMENT PAGE (Quản lý Ca)
   Staff: Đăng ký ca | Ca của tôi | Lịch toàn bộ NV
   Admin: Cấu hình ca | Sắp xếp ca | Giờ làm thêm | Tính lương
   ====================================== */
const AttendancePage = {
    shiftTypes: [],
    users: [],
    currentMonth: new Date().toISOString().slice(0, 7),
    activeTab: '',

    async render() {
        const content = document.getElementById('content-area');
        const isAdmin = App.user.role === 'admin';

        const tabs = isAdmin
            ? `<button class="tab-btn active" id="tab-config" onclick="AttendancePage.switchTab('config')">⚙️ Cấu hình ca</button>
               <button class="tab-btn" id="tab-schedule" onclick="AttendancePage.switchTab('schedule')">📅 Sắp xếp ca</button>
               <button class="tab-btn" id="tab-overtime" onclick="AttendancePage.switchTab('overtime')">⏱️ Giờ làm thêm</button>
               <button class="tab-btn" id="tab-payroll" onclick="AttendancePage.switchTab('payroll')">💰 Tính lương</button>`
            : `<button class="tab-btn active" id="tab-register" onclick="AttendancePage.switchTab('register')">📝 Đăng ký ca</button>
               <button class="tab-btn" id="tab-my-shifts" onclick="AttendancePage.switchTab('my-shifts')">📋 Ca của tôi</button>
               <button class="tab-btn" id="tab-all-schedule" onclick="AttendancePage.switchTab('all-schedule')">👥 Lịch toàn bộ NV</button>`;

        content.innerHTML = `
            <div class="tabs-header">${tabs}</div>
            <div class="table-toolbar">
                <div class="form-group" style="margin-bottom:0;min-width:180px;">
                    <input type="month" id="att-month" value="${this.currentMonth}">
                </div>
                <div id="toolbar-actions"></div>
            </div>
            <div id="att-content"><div class="loading"><div class="spinner"></div></div></div>
        `;

        document.getElementById('att-month').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.switchTab(this.activeTab);
        });

        try { this.shiftTypes = await App.api('/shifts/types'); } catch(e) { this.shiftTypes = []; }
        try { this.users = await App.api('/users'); } catch(e) { this.users = []; }

        this.switchTab(isAdmin ? 'config' : 'register');
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const el = document.getElementById(`tab-${tab}`);
        if (el) el.classList.add('active');

        const toolbar = document.getElementById('toolbar-actions');
        toolbar.innerHTML = '';

        switch(tab) {
            case 'config': this.renderConfig(); break;
            case 'schedule': this.renderSchedule(); break;
            case 'overtime': this.renderOvertime(); break;
            case 'payroll': this.renderPayroll(); break;
            case 'register': this.renderRegister(); break;
            case 'my-shifts': this.renderMyShifts(); break;
            case 'all-schedule': this.renderAllSchedule(); break;
        }
    },

    // ====================== ADMIN: CẤU HÌNH CA ======================
    async renderConfig() {
        const toolbar = document.getElementById('toolbar-actions');
        toolbar.innerHTML = `<button class="btn btn-primary" onclick="AttendancePage.showShiftTypeForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm loại ca</button>`;

        try {
            this.shiftTypes = await App.api('/shifts/types');
        } catch(e) { this.shiftTypes = []; }

        const container = document.getElementById('att-content');
        if (this.shiftTypes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Chưa có loại ca nào. Hãy thêm loại ca mới!</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container"><table>
                <thead><tr><th>Tên ca</th><th>Giờ bắt đầu</th><th>Giờ kết thúc</th><th>Hệ số lương</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                <tbody>
                    ${this.shiftTypes.map(s => `<tr>
                        <td style="font-weight:600;color:var(--text-primary)">${s.name}</td>
                        <td>${s.start_time?.substring(0,5) || s.start_time}</td>
                        <td>${s.end_time?.substring(0,5) || s.end_time}</td>
                        <td><span class="badge" style="${s.pay_multiplier > 1 ? 'background:rgba(245,158,11,0.15);color:#d97706;border:1px solid rgba(245,158,11,0.3)' : ''}">×${Number(s.pay_multiplier).toFixed(1)}</span></td>
                        <td>${s.is_active ? '<span style="color:var(--success)">✅ Hoạt động</span>' : '<span style="color:var(--text-muted)">❌ Tắt</span>'}</td>
                        <td><div class="btn-group">
                            <button class="btn btn-sm btn-secondary" onclick="AttendancePage.showShiftTypeForm(${s.id})">Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="AttendancePage.deleteShiftType(${s.id})">Xóa</button>
                        </div></td>
                    </tr>`).join('')}
                </tbody>
            </table></div>
        `;
    },

    showShiftTypeForm(editId = null) {
        const s = editId ? this.shiftTypes.find(x => x.id === editId) : null;
        App.showModal(s ? 'Sửa loại ca' : 'Thêm loại ca', `
            <form id="st-form" onsubmit="return false;">
                <div class="form-group"><label>Tên ca *</label><input type="text" id="st-name" value="${s ? s.name : ''}" required placeholder="Ca sáng, Ca đêm..."></div>
                <div class="form-row">
                    <div class="form-group"><label>Giờ bắt đầu *</label><input type="time" id="st-start" value="${s ? (s.start_time?.substring(0,5)||s.start_time) : '08:00'}" required></div>
                    <div class="form-group"><label>Giờ kết thúc *</label><input type="time" id="st-end" value="${s ? (s.end_time?.substring(0,5)||s.end_time) : '17:00'}" required></div>
                </div>
                <div class="form-group"><label>Hệ số lương</label>
                    <select id="st-multi">
                        <option value="1.0" ${!s || s.pay_multiplier == 1.0 ? 'selected' : ''}>×1.0 (Bình thường)</option>
                        <option value="1.5" ${s && s.pay_multiplier == 1.5 ? 'selected' : ''}>×1.5 (Ca đêm)</option>
                        <option value="2.0" ${s && s.pay_multiplier == 2.0 ? 'selected' : ''}>×2.0 (Ngày lễ)</option>
                    </select>
                </div>
                ${s ? `<div class="form-group"><label><input type="checkbox" id="st-active" ${s.is_active ? 'checked' : ''}> Đang hoạt động</label></div>` : ''}
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">${s ? 'Cập nhật' : 'Tạo mới'}</button>
                </div>
            </form>
        `);
        document.getElementById('st-form').addEventListener('submit', async () => {
            const data = {
                name: document.getElementById('st-name').value,
                start_time: document.getElementById('st-start').value,
                end_time: document.getElementById('st-end').value,
                pay_multiplier: parseFloat(document.getElementById('st-multi').value)
            };
            if (editId) data.is_active = document.getElementById('st-active')?.checked !== false;
            try {
                if (editId) await App.api(`/shifts/types/${editId}`, { method: 'PUT', body: JSON.stringify(data) });
                else await App.api('/shifts/types', { method: 'POST', body: JSON.stringify(data) });
                App.toast(editId ? 'Cập nhật thành công!' : 'Tạo loại ca thành công!', 'success');
                App.closeModal();
                this.renderConfig();
            } catch(e) { App.toast(e.message, 'error'); }
        });
    },

    async deleteShiftType(id) {
        if (!confirm('Xóa loại ca này?')) return;
        try { await App.api(`/shifts/types/${id}`, { method: 'DELETE' }); App.toast('Đã xóa!', 'success'); this.renderConfig(); }
        catch(e) { App.toast(e.message, 'error'); }
    },

    // ====================== ADMIN: SẮP XẾP CA ======================
    async renderSchedule() {
        const toolbar = document.getElementById('toolbar-actions');
        toolbar.innerHTML = `
            <button class="btn btn-primary" onclick="AttendancePage.showAssignmentForm()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Phân ca</button>
            <button class="btn btn-success" onclick="AttendancePage.autoSchedule()">🤖 Tự động sắp xếp</button>`;

        const container = document.getElementById('att-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const assignments = await App.api(`/shifts/assignments/all?month=${this.currentMonth}`);
            // Hiện đề xuất pending
            let pendingHtml = '';
            try {
                const requests = await App.api(`/shifts/requests/all?month=${this.currentMonth}&status=pending`);
                if (requests.length > 0) {
                    pendingHtml = `
                    <div style="margin-bottom:16px;padding:16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;">
                        <h4 style="margin-bottom:12px;color:#d97706">📬 Đề xuất chờ duyệt (${requests.length})</h4>
                        <div class="table-container"><table><thead><tr><th>NV</th><th>Ca</th><th>Ngày</th><th>Ghi chú</th><th>Hành động</th></tr></thead><tbody>
                        ${requests.map(r => `<tr>
                            <td style="font-weight:500">${r.full_name||r.username}</td>
                            <td>${r.shift_name}</td>
                            <td>${App.formatDate(r.work_date)}</td>
                            <td>${r.note||'-'}</td>
                            <td><div class="btn-group">
                                <button class="btn btn-sm btn-success" onclick="AttendancePage.reviewRequest(${r.id},'approved')">✅ Duyệt</button>
                                <button class="btn btn-sm btn-danger" onclick="AttendancePage.reviewRequest(${r.id},'rejected')">❌ Từ chối</button>
                            </div></td>
                        </tr>`).join('')}
                        </tbody></table></div>
                    </div>`;
                }
            } catch(e) {}

            if (assignments.length === 0 && !pendingHtml) {
                container.innerHTML = '<div class="empty-state"><p>Chưa có lịch phân ca tháng này</p></div>';
                return;
            }

            // Group by date
            const byDate = {};
            assignments.forEach(a => {
                const d = a.work_date?.split('T')[0] || a.work_date;
                if (!byDate[d]) byDate[d] = [];
                byDate[d].push(a);
            });
            const dates = Object.keys(byDate).sort();

            container.innerHTML = `
                ${pendingHtml}
                <div class="table-container"><table>
                    <thead><tr><th>Ngày</th><th>Nhân viên</th><th>Ca</th><th>Giờ</th><th>Ghi chú</th><th>Xóa</th></tr></thead>
                    <tbody>
                    ${dates.map(date => {
                        const recs = byDate[date];
                        return recs.map((r, idx) => `<tr>
                            ${idx === 0 ? `<td rowspan="${recs.length}" style="font-weight:600;vertical-align:middle;border-right:1px solid var(--border)">${App.formatDate(date)}</td>` : ''}
                            <td style="font-weight:500">${r.full_name||r.username}</td>
                            <td><span class="badge" style="${r.pay_multiplier > 1 ? 'background:rgba(245,158,11,0.15);color:#d97706' : ''}">${r.shift_name}</span></td>
                            <td>${r.start_time?.substring(0,5)} - ${r.end_time?.substring(0,5)}</td>
                            <td>${r.note||'-'}</td>
                            <td><button class="btn btn-sm btn-danger" onclick="AttendancePage.deleteAssignment(${r.id})">🗑️</button></td>
                        </tr>`).join('');
                    }).join('')}
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    },

    showAssignmentForm() {
        const staffList = this.users.filter(u => u.role === 'staff');
        const today = new Date().toISOString().split('T')[0];
        App.showModal('Phân ca nhân viên', `
            <form id="assign-form" onsubmit="return false;">
                <div class="form-group"><label>Nhân viên *</label>
                    <select id="as-user" required>
                        <option value="">-- Chọn NV --</option>
                        ${staffList.map(u => `<option value="${u.id}">${u.full_name||u.username}</option>`).join('')}
                    </select></div>
                <div class="form-group"><label>Loại ca *</label>
                    <select id="as-shift" required>
                        ${this.shiftTypes.filter(s=>s.is_active).map(s => `<option value="${s.id}">${s.name} (${s.start_time?.substring(0,5)}-${s.end_time?.substring(0,5)}) ×${Number(s.pay_multiplier).toFixed(1)}</option>`).join('')}
                    </select></div>
                <div class="form-group"><label>Ngày *</label><input type="date" id="as-date" value="${today}" required></div>
                <div class="form-group"><label>Ghi chú</label><input type="text" id="as-note" placeholder="Tùy chọn"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Phân ca</button>
                </div>
            </form>
        `);
        document.getElementById('assign-form').addEventListener('submit', async () => {
            try {
                await App.api('/shifts/assignments', { method: 'POST', body: JSON.stringify({
                    user_id: parseInt(document.getElementById('as-user').value),
                    shift_type_id: parseInt(document.getElementById('as-shift').value),
                    work_date: document.getElementById('as-date').value,
                    note: document.getElementById('as-note').value
                })});
                App.toast('Phân ca thành công!', 'success'); App.closeModal(); this.renderSchedule();
            } catch(e) { App.toast(e.message, 'error'); }
        });
    },

    async autoSchedule() {
        if (!confirm(`Tự động sắp xếp ca cho tháng ${this.currentMonth}?\n\nHệ thống sẽ phân đều nhân viên vào các ca, đảm bảo mỗi ngày đều có người làm.`)) return;
        try {
            const res = await App.api('/shifts/assignments/auto', { method: 'POST', body: JSON.stringify({ month: this.currentMonth }) });
            App.toast(res.message, 'success');
            this.renderSchedule();
        } catch(e) { App.toast(e.message, 'error'); }
    },

    async deleteAssignment(id) {
        if (!confirm('Xóa phân ca này?')) return;
        try { await App.api(`/shifts/assignments/${id}`, { method: 'DELETE' }); App.toast('Đã xóa!', 'success'); this.renderSchedule(); }
        catch(e) { App.toast(e.message, 'error'); }
    },

    async reviewRequest(id, status) {
        const label = status === 'approved' ? 'duyệt' : 'từ chối';
        if (!confirm(`Bạn muốn ${label} đề xuất này?`)) return;
        try {
            await App.api(`/shifts/requests/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) });
            App.toast(status === 'approved' ? 'Đã duyệt và tạo lịch!' : 'Đã từ chối!', 'success');
            this.renderSchedule();
        } catch(e) { App.toast(e.message, 'error'); }
    },

    // ====================== ADMIN: GIỜ LÀM THÊM ======================
    async renderOvertime() {
        const toolbar = document.getElementById('toolbar-actions');
        toolbar.innerHTML = `<button class="btn btn-primary" onclick="AttendancePage.showOvertimeForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm OT</button>`;

        const container = document.getElementById('att-content');
        try {
            const records = await App.api(`/shifts/overtime?month=${this.currentMonth}`);
            if (records.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Chưa có giờ làm thêm tháng này</p></div>';
                return;
            }
            const totalOT = records.reduce((s,r) => s + Number(r.hours), 0);
            container.innerHTML = `
                <div class="stat-grid" style="margin-bottom:16px">
                    <div class="stat-card"><div class="stat-icon revenue">⏱️</div><div class="stat-value">${totalOT}h</div><div class="stat-label">Tổng OT tháng ${this.currentMonth}</div></div>
                    <div class="stat-card"><div class="stat-icon products">📝</div><div class="stat-value">${records.length}</div><div class="stat-label">Lượt ghi nhận</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Nhân viên</th><th>Ngày</th><th>Số giờ OT</th><th>Lý do</th><th>Người ghi</th><th>Xóa</th></tr></thead>
                    <tbody>
                    ${records.map(r => `<tr>
                        <td style="font-weight:500">${r.full_name||r.username}</td>
                        <td>${App.formatDate(r.work_date)}</td>
                        <td style="font-weight:600;color:var(--warning)">${r.hours}h</td>
                        <td>${r.reason||'-'}</td>
                        <td>${r.created_by_name||'-'}</td>
                        <td><button class="btn btn-sm btn-danger" onclick="AttendancePage.deleteOT(${r.id})">🗑️</button></td>
                    </tr>`).join('')}
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    },

    showOvertimeForm() {
        const staffList = this.users.filter(u => u.role === 'staff');
        const today = new Date().toISOString().split('T')[0];
        App.showModal('Thêm giờ làm thêm', `
            <form id="ot-form" onsubmit="return false;">
                <div class="form-group"><label>Nhân viên *</label>
                    <select id="ot-user" required><option value="">-- Chọn --</option>
                        ${staffList.map(u => `<option value="${u.id}">${u.full_name||u.username}</option>`).join('')}
                    </select></div>
                <div class="form-group"><label>Ngày *</label><input type="date" id="ot-date" value="${today}" required></div>
                <div class="form-group"><label>Số giờ OT *</label><input type="number" id="ot-hours" min="0.5" max="12" step="0.5" value="1" required></div>
                <div class="form-group"><label>Lý do</label><input type="text" id="ot-reason" placeholder="Hàng nhiều, sự kiện..."></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Lưu</button>
                </div>
            </form>
        `);
        document.getElementById('ot-form').addEventListener('submit', async () => {
            try {
                await App.api('/shifts/overtime', { method: 'POST', body: JSON.stringify({
                    user_id: parseInt(document.getElementById('ot-user').value),
                    work_date: document.getElementById('ot-date').value,
                    hours: parseFloat(document.getElementById('ot-hours').value),
                    reason: document.getElementById('ot-reason').value
                })});
                App.toast('Đã thêm OT!', 'success'); App.closeModal(); this.renderOvertime();
            } catch(e) { App.toast(e.message, 'error'); }
        });
    },

    async deleteOT(id) {
        if (!confirm('Xóa ghi nhận OT này?')) return;
        try { await App.api(`/shifts/overtime/${id}`, { method: 'DELETE' }); App.toast('Đã xóa!', 'success'); this.renderOvertime(); }
        catch(e) { App.toast(e.message, 'error'); }
    },

    // ====================== ADMIN: TÍNH LƯƠNG ======================
    async renderPayroll() {
        const container = document.getElementById('att-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            const payroll = await App.api(`/shifts/payroll?month=${this.currentMonth}`);
            if (payroll.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Không có dữ liệu lương tháng này</p></div>';
                return;
            }
            const grandTotal = payroll.reduce((s, r) => s + r.total_salary, 0);
            container.innerHTML = `
                <div class="stat-grid" style="margin-bottom:16px">
                    <div class="stat-card"><div class="stat-icon revenue">💰</div><div class="stat-value">${App.formatCurrency(grandTotal)}</div><div class="stat-label">Tổng chi lương tháng ${this.currentMonth}</div></div>
                    <div class="stat-card"><div class="stat-icon products">👥</div><div class="stat-value">${payroll.length}</div><div class="stat-label">Nhân viên</div></div>
                    ${App.user.role === 'admin' ? `
                    <div class="stat-card" style="display:flex; align-items:center; justify-content:center;">
                        <button class="btn btn-primary" onclick="AttendancePage.savePayrollToExpenses(${grandTotal}, '${this.currentMonth}')" style="width:100%;height:100%;font-size:16px;font-weight:bold;">
                            💾 LƯU CHỐT LƯƠNG VÀO CHI PHÍ
                        </button>
                    </div>
                    ` : ''}
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Nhân viên</th><th>Số ca</th><th>Giờ thường</th><th>Giờ đêm (×1.5)</th><th>OT</th><th>Lương thường</th><th>Lương đêm</th><th>Lương OT</th><th style="color:var(--success)">Tổng lương</th></tr></thead>
                    <tbody>
                    ${payroll.map(r => `<tr>
                        <td style="font-weight:500;color:var(--text-primary)">${r.full_name||r.username}</td>
                        <td style="font-weight:600">${r.total_shifts}</td>
                        <td>${r.normal_hours}h</td>
                        <td style="color:${r.night_hours > 0 ? 'var(--warning)' : 'var(--text-muted)'}">${r.night_hours > 0 ? r.night_hours + 'h' : '-'}</td>
                        <td style="color:${r.total_ot > 0 ? 'var(--warning)' : 'var(--text-muted)'}">${r.total_ot > 0 ? r.total_ot + 'h' : '-'}</td>
                        <td>${App.formatCurrency(r.normal_pay)}</td>
                        <td>${App.formatCurrency(r.night_pay)}</td>
                        <td>${App.formatCurrency(r.ot_pay)}</td>
                        <td style="color:var(--success);font-weight:700">${App.formatCurrency(r.total_salary)}</td>
                    </tr>`).join('')}
                    <tr style="background:rgba(255,255,255,0.05);font-weight:700">
                        <td>TỔNG CỘNG</td><td colspan="7"></td>
                        <td style="color:var(--success);font-size:1.05rem">${App.formatCurrency(grandTotal)}</td>
                    </tr>
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    },

    // ====================== STAFF: ĐĂNG KÝ CA ======================
    async renderRegister() {
        const toolbar = document.getElementById('toolbar-actions');
        toolbar.innerHTML = `<button class="btn btn-primary" onclick="AttendancePage.showRequestForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Đăng ký ca mới</button>`;

        const container = document.getElementById('att-content');
        try {
            const requests = await App.api(`/shifts/requests?month=${this.currentMonth}`);
            if (requests.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Chưa có đề xuất nào. Hãy đăng ký ca làm!</p></div>';
                return;
            }
            container.innerHTML = `
                <div class="table-container"><table>
                    <thead><tr><th>Ca</th><th>Ngày</th><th>Ghi chú</th><th>Trạng thái</th><th>Người duyệt</th></tr></thead>
                    <tbody>
                    ${requests.map(r => {
                        const statusMap = { pending: '⏳ Chờ duyệt', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };
                        const statusColor = { pending: '#d97706', approved: 'var(--success)', rejected: 'var(--danger)' };
                        return `<tr>
                            <td style="font-weight:500">${r.shift_name} (${r.start_time?.substring(0,5)}-${r.end_time?.substring(0,5)})</td>
                            <td>${App.formatDate(r.work_date)}</td>
                            <td>${r.note||'-'}</td>
                            <td style="color:${statusColor[r.status]};font-weight:600">${statusMap[r.status]}</td>
                            <td>${r.reviewer_name||'-'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    },

    showRequestForm() {
        const today = new Date().toISOString().split('T')[0];
        App.showModal('Đăng ký ca làm', `
            <form id="req-form" onsubmit="return false;">
                <div class="form-group"><label>Loại ca *</label>
                    <select id="rq-shift" required>
                        ${this.shiftTypes.filter(s=>s.is_active).map(s => `<option value="${s.id}">${s.name} (${s.start_time?.substring(0,5)}-${s.end_time?.substring(0,5)}) ×${Number(s.pay_multiplier).toFixed(1)}</option>`).join('')}
                    </select></div>
                <div class="form-group"><label>Ngày muốn làm *</label><input type="date" id="rq-date" value="${today}" required></div>
                <div class="form-group"><label>Ghi chú</label><input type="text" id="rq-note" placeholder="Lý do, yêu cầu đặc biệt..."></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary">Gửi đề xuất</button>
                </div>
            </form>
        `);
        document.getElementById('req-form').addEventListener('submit', async () => {
            try {
                await App.api('/shifts/requests', { method: 'POST', body: JSON.stringify({
                    shift_type_id: parseInt(document.getElementById('rq-shift').value),
                    work_date: document.getElementById('rq-date').value,
                    note: document.getElementById('rq-note').value
                })});
                App.toast('Đã gửi đề xuất! Chờ admin duyệt.', 'success'); App.closeModal(); this.renderRegister();
            } catch(e) { App.toast(e.message, 'error'); }
        });
    },

    // ====================== STAFF: CA CỦA TÔI ======================
    async renderMyShifts() {
        const container = document.getElementById('att-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            const shifts = await App.api(`/shifts/assignments?month=${this.currentMonth}`);
            if (shifts.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Bạn chưa có ca làm tháng này</p></div>';
                return;
            }
            const totalShifts = shifts.length;
            const totalHours = shifts.reduce((s, r) => {
                const st = r.start_time, et = r.end_time;
                let h = 8;
                if (st && et) {
                    const [sh,sm] = st.split(':').map(Number);
                    const [eh,em] = et.split(':').map(Number);
                    h = eh > sh ? (eh - sh) : (24 - sh + eh);
                }
                return s + h;
            }, 0);

            container.innerHTML = `
                <div class="stat-grid" style="margin-bottom:16px">
                    <div class="stat-card"><div class="stat-icon products">📅</div><div class="stat-value">${totalShifts}</div><div class="stat-label">Tổng ca tháng này</div></div>
                    <div class="stat-card"><div class="stat-icon revenue">⏱️</div><div class="stat-value">${totalHours}h</div><div class="stat-label">Tổng giờ làm</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Ngày</th><th>Ca</th><th>Giờ</th><th>Hệ số</th><th>Ghi chú</th></tr></thead>
                    <tbody>
                    ${shifts.map(r => `<tr>
                        <td style="font-weight:600">${App.formatDate(r.work_date)}</td>
                        <td><span class="badge" style="${r.pay_multiplier > 1 ? 'background:rgba(245,158,11,0.15);color:#d97706' : ''}">${r.shift_name}</span></td>
                        <td>${r.start_time?.substring(0,5)} - ${r.end_time?.substring(0,5)}</td>
                        <td>×${Number(r.pay_multiplier).toFixed(1)}</td>
                        <td>${r.note||'-'}</td>
                    </tr>`).join('')}
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    },

    // ====================== STAFF: LỊCH TOÀN BỘ NV ======================
    async renderAllSchedule() {
        const container = document.getElementById('att-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        try {
            const shifts = await App.api(`/shifts/assignments/all?month=${this.currentMonth}`);
            if (shifts.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Chưa có lịch phân ca tháng này</p></div>';
                return;
            }

            const byDate = {};
            shifts.forEach(a => {
                const d = a.work_date?.split('T')[0] || a.work_date;
                if (!byDate[d]) byDate[d] = [];
                byDate[d].push(a);
            });
            const dates = Object.keys(byDate).sort();

            container.innerHTML = `
                <div style="margin-bottom:12px;padding:12px 16px;background:rgba(99,102,241,0.08);border-radius:8px;border:1px solid rgba(99,102,241,0.15);font-size:0.85rem;color:var(--text-secondary);">
                    📌 Lịch ca toàn cửa hàng tháng <strong>${this.currentMonth}</strong> — Chỉ xem
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Ngày</th><th>Nhân viên</th><th>Ca</th><th>Giờ</th></tr></thead>
                    <tbody>
                    ${dates.map(date => {
                        const recs = byDate[date];
                        return recs.map((r, idx) => `<tr style="${r.user_id === App.user.id ? 'background:rgba(99,102,241,0.08);' : ''}">
                            ${idx === 0 ? `<td rowspan="${recs.length}" style="font-weight:600;vertical-align:middle;border-right:1px solid var(--border)">${App.formatDate(date)}</td>` : ''}
                            <td style="font-weight:${r.user_id === App.user.id ? '600' : '400'};color:${r.user_id === App.user.id ? 'var(--accent-primary)' : 'var(--text-primary)'}">
                                ${r.full_name||r.username}${r.user_id === App.user.id ? ' <span style="font-size:11px;opacity:0.7">(Bạn)</span>' : ''}
                            </td>
                            <td><span class="badge" style="${r.pay_multiplier > 1 ? 'background:rgba(245,158,11,0.15);color:#d97706' : ''}">${r.shift_name}</span></td>
                            <td>${r.start_time?.substring(0,5)} - ${r.end_time?.substring(0,5)}</td>
                        </tr>`).join('');
                    }).join('')}
                    </tbody>
                </table></div>
            `;
        } catch(e) { container.innerHTML = `<div class="empty-state"><p>Lỗi: ${e.message}</p></div>`; }
    }
};

window.AttendancePage = AttendancePage;
