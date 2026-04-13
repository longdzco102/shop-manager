const db = require('../config/db');

class Shift {
    // ============ SHIFT TYPES ============
    static async getShiftTypes() {
        const [rows] = await db.query('SELECT * FROM shift_types ORDER BY start_time');
        return rows;
    }

    static async createShiftType(data) {
        const [result] = await db.query(
            'INSERT INTO shift_types (name, start_time, end_time, pay_multiplier) VALUES (?, ?, ?, ?)',
            [data.name, data.start_time, data.end_time, data.pay_multiplier || 1.0]
        );
        return { id: result.insertId };
    }

    static async updateShiftType(id, data) {
        const [result] = await db.query(
            'UPDATE shift_types SET name=?, start_time=?, end_time=?, pay_multiplier=?, is_active=? WHERE id=?',
            [data.name, data.start_time, data.end_time, data.pay_multiplier || 1.0, data.is_active !== false, id]
        );
        return result.affectedRows > 0;
    }

    static async deleteShiftType(id) {
        const [result] = await db.query('DELETE FROM shift_types WHERE id=?', [id]);
        return result.affectedRows > 0;
    }

    // ============ SHIFT ASSIGNMENTS ============
    static async getAssignments(filters = {}) {
        let sql = `
            SELECT sa.*, st.name as shift_name, st.start_time, st.end_time, st.pay_multiplier,
                   u.full_name, u.username
            FROM shift_assignments sa
            JOIN shift_types st ON sa.shift_type_id = st.id
            JOIN users u ON sa.user_id = u.id
            WHERE u.role NOT IN ('customer')
        `;
        const params = [];
        if (filters.month) {
            sql += ' AND DATE_FORMAT(sa.work_date, "%Y-%m") = ?';
            params.push(filters.month);
        }
        if (filters.week_start && filters.week_end) {
            sql += ' AND sa.work_date BETWEEN ? AND ?';
            params.push(filters.week_start, filters.week_end);
        }
        if (filters.user_id) {
            sql += ' AND sa.user_id = ?';
            params.push(filters.user_id);
        }
        sql += ' ORDER BY sa.work_date, st.start_time, u.full_name';
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createAssignment(data) {
        const [result] = await db.query(
            'INSERT INTO shift_assignments (user_id, shift_type_id, work_date, note) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE shift_type_id=VALUES(shift_type_id), note=VALUES(note)',
            [data.user_id, data.shift_type_id, data.work_date, data.note || '']
        );
        return { id: result.insertId };
    }

    static async deleteAssignment(id) {
        const [result] = await db.query('DELETE FROM shift_assignments WHERE id=?', [id]);
        return result.affectedRows > 0;
    }

    // Auto-schedule: đảm bảo mỗi ngày đều có người
    static async autoSchedule(month) {
        // Lấy danh sách NV (không phải admin/customer)
        const [staff] = await db.query("SELECT id FROM users WHERE role = 'staff' ORDER BY id");
        if (staff.length === 0) return { assigned: 0 };

        // Lấy shift types active
        const [shifts] = await db.query('SELECT id FROM shift_types WHERE is_active = 1 ORDER BY start_time');
        if (shifts.length === 0) return { assigned: 0 };

        // Tạo danh sách tất cả ngày trong tháng
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        const dates = [];
        for (let d = 1; d <= daysInMonth; d++) {
            dates.push(`${month}-${String(d).padStart(2, '0')}`);
        }

        // Lấy các assignment đã có
        const [existing] = await db.query(
            'SELECT user_id, work_date, shift_type_id FROM shift_assignments WHERE DATE_FORMAT(work_date, "%Y-%m") = ?',
            [month]
        );
        const existingSet = new Set(existing.map(e => `${e.user_id}-${e.work_date.toISOString().split('T')[0]}-${e.shift_type_id}`));

        let assigned = 0;
        let staffIdx = 0;

        for (const date of dates) {
            for (const shift of shifts) {
                // Kiểm tra xem ca này ngày này đã có ai chưa
                const hasAssignment = existing.some(e => {
                    const eDate = e.work_date instanceof Date ? e.work_date.toISOString().split('T')[0] : e.work_date;
                    return eDate === date && e.shift_type_id === shift.id;
                });

                if (!hasAssignment) {
                    const userId = staff[staffIdx % staff.length].id;
                    const key = `${userId}-${date}-${shift.id}`;
                    if (!existingSet.has(key)) {
                        try {
                            await db.query(
                                'INSERT IGNORE INTO shift_assignments (user_id, shift_type_id, work_date, note) VALUES (?, ?, ?, ?)',
                                [userId, shift.id, date, 'Tự động sắp xếp']
                            );
                            assigned++;
                        } catch (e) { /* duplicate, skip */ }
                    }
                    staffIdx++;
                }
            }
        }

        return { assigned };
    }

    // ============ SHIFT REQUESTS ============
    static async getRequests(filters = {}) {
        let sql = `
            SELECT sr.*, st.name as shift_name, st.start_time, st.end_time,
                   u.full_name, u.username,
                   ru.full_name as reviewer_name
            FROM shift_requests sr
            JOIN shift_types st ON sr.shift_type_id = st.id
            JOIN users u ON sr.user_id = u.id
            LEFT JOIN users ru ON sr.reviewed_by = ru.id
            WHERE 1=1
        `;
        const params = [];
        if (filters.user_id) {
            sql += ' AND sr.user_id = ?';
            params.push(filters.user_id);
        }
        if (filters.status) {
            sql += ' AND sr.status = ?';
            params.push(filters.status);
        }
        if (filters.month) {
            sql += ' AND DATE_FORMAT(sr.work_date, "%Y-%m") = ?';
            params.push(filters.month);
        }
        sql += ' ORDER BY sr.created_at DESC';
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createRequest(data) {
        const [result] = await db.query(
            'INSERT INTO shift_requests (user_id, shift_type_id, work_date, note) VALUES (?, ?, ?, ?)',
            [data.user_id, data.shift_type_id, data.work_date, data.note || '']
        );
        return { id: result.insertId };
    }

    static async reviewRequest(id, status, reviewedBy) {
        const [result] = await db.query(
            'UPDATE shift_requests SET status=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?',
            [status, reviewedBy, id]
        );

        // Nếu duyệt → tạo assignment
        if (status === 'approved') {
            const [req] = await db.query('SELECT * FROM shift_requests WHERE id=?', [id]);
            if (req.length > 0) {
                const r = req[0];
                await db.query(
                    'INSERT IGNORE INTO shift_assignments (user_id, shift_type_id, work_date, note) VALUES (?, ?, ?, ?)',
                    [r.user_id, r.shift_type_id, r.work_date, r.note || 'Đề xuất được duyệt']
                );
            }
        }

        return result.affectedRows > 0;
    }

    // ============ OVERTIME ============
    static async getOvertime(filters = {}) {
        let sql = `
            SELECT ot.*, u.full_name, u.username, cu.full_name as created_by_name
            FROM overtime_records ot
            JOIN users u ON ot.user_id = u.id
            JOIN users cu ON ot.created_by = cu.id
            WHERE u.role NOT IN ('customer')
        `;
        const params = [];
        if (filters.month) {
            sql += ' AND DATE_FORMAT(ot.work_date, "%Y-%m") = ?';
            params.push(filters.month);
        }
        sql += ' ORDER BY ot.work_date DESC, u.full_name';
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createOvertime(data) {
        const [result] = await db.query(
            'INSERT INTO overtime_records (user_id, work_date, hours, reason, created_by) VALUES (?, ?, ?, ?, ?)',
            [data.user_id, data.work_date, data.hours, data.reason || '', data.created_by]
        );
        return { id: result.insertId };
    }

    static async deleteOvertime(id) {
        const [result] = await db.query('DELETE FROM overtime_records WHERE id=?', [id]);
        return result.affectedRows > 0;
    }

    // ============ PAYROLL ============
    static async getPayroll(month) {
        // Tính lương dựa trên shift_assignments (đã phân/duyệt) + overtime_records
        const sql = `
            SELECT 
                u.id as user_id, u.full_name, u.username,
                u.hourly_rate, u.overtime_rate,
                COALESCE(shifts.total_shifts, 0) as total_shifts,
                COALESCE(shifts.normal_hours, 0) as normal_hours,
                COALESCE(shifts.night_hours, 0) as night_hours,
                COALESCE(ot.total_ot, 0) as total_ot
            FROM users u
            LEFT JOIN (
                SELECT sa.user_id,
                    COUNT(*) as total_shifts,
                    SUM(CASE WHEN st.pay_multiplier = 1.0 THEN 
                        CASE WHEN st.end_time > st.start_time 
                            THEN TIMESTAMPDIFF(HOUR, CONCAT('2000-01-01 ', st.start_time), CONCAT('2000-01-01 ', st.end_time))
                            ELSE 24 - TIMESTAMPDIFF(HOUR, CONCAT('2000-01-01 ', st.end_time), CONCAT('2000-01-01 ', st.start_time))
                        END ELSE 0 END) as normal_hours,
                    SUM(CASE WHEN st.pay_multiplier > 1.0 THEN 
                        CASE WHEN st.end_time > st.start_time 
                            THEN TIMESTAMPDIFF(HOUR, CONCAT('2000-01-01 ', st.start_time), CONCAT('2000-01-01 ', st.end_time))
                            ELSE 24 - TIMESTAMPDIFF(HOUR, CONCAT('2000-01-01 ', st.end_time), CONCAT('2000-01-01 ', st.start_time))
                        END ELSE 0 END) as night_hours
                FROM shift_assignments sa
                JOIN shift_types st ON sa.shift_type_id = st.id
                WHERE DATE_FORMAT(sa.work_date, "%Y-%m") = ?
                GROUP BY sa.user_id
            ) shifts ON u.id = shifts.user_id
            LEFT JOIN (
                SELECT user_id, SUM(hours) as total_ot
                FROM overtime_records
                WHERE DATE_FORMAT(work_date, "%Y-%m") = ?
                GROUP BY user_id
            ) ot ON u.id = ot.user_id
            WHERE u.role NOT IN ('admin', 'customer')
            AND (shifts.total_shifts > 0 OR ot.total_ot > 0)
            ORDER BY u.full_name
        `;
        const [rows] = await db.query(sql, [month, month]);

        return rows.map(r => {
            const hourlyRate = Number(r.hourly_rate) || 25000;
            const overtimeRate = Number(r.overtime_rate) || 37500;
            const normalHours = Number(r.normal_hours) || 0;
            const nightHours = Number(r.night_hours) || 0;
            const totalOt = Number(r.total_ot) || 0;

            const normalPay = normalHours * hourlyRate;
            const nightPay = nightHours * hourlyRate * 1.5;
            const otPay = totalOt * overtimeRate;

            return {
                ...r,
                normal_pay: normalPay,
                night_pay: nightPay,
                ot_pay: otPay,
                total_salary: normalPay + nightPay + otPay
            };
        });
    }
}

module.exports = Shift;
