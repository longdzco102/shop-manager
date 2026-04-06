const db = require('../config/db');

class Attendance {
    static async findAll(filters = {}) {
        let sql = `
            SELECT a.*, u.full_name, u.username 
            FROM attendance a
            JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (filters.month) {
            conditions.push('DATE_FORMAT(a.work_date, "%Y-%m") = ?');
            params.push(filters.month);
        }
        if (filters.user_id) {
            conditions.push('a.user_id = ?');
            params.push(filters.user_id);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY a.work_date DESC, a.user_id';

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async checkDuplicate(userId, workDate) {
        const [existing] = await db.query(
            'SELECT id FROM attendance WHERE user_id = ? AND work_date = ?',
            [userId, workDate]
        );
        return existing.length > 0;
    }

    static async create(data) {
        const [result] = await db.query(
            'INSERT INTO attendance (user_id, work_date, hours_worked, overtime_hours, note) VALUES (?, ?, ?, ?, ?)',
            [data.user_id, data.work_date, data.hours_worked, data.overtime_hours || 0, data.note || '']
        );
        return { id: result.insertId };
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async update(id, data) {
        const [result] = await db.query(
            'UPDATE attendance SET hours_worked = ?, overtime_hours = ?, note = ? WHERE id = ?',
            [data.hours_worked, data.overtime_hours, data.note, id]
        );
        return result.affectedRows > 0;
    }

    static async getPayroll(month, userId = null) {
        const baseQuery = `
            SELECT 
                u.id as user_id, u.full_name, u.username,
                COUNT(a.id) as total_days,
                COALESCE(SUM(a.hours_worked), 0) as total_hours,
                COALESCE(SUM(a.overtime_hours), 0) as total_overtime,
                COALESCE(u.base_salary, 0) as base_salary,
                COALESCE(u.hourly_rate, 0) as hourly_rate,
                COALESCE(u.overtime_rate, 0) as overtime_rate
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND DATE_FORMAT(a.work_date, "%Y-%m") = ?
            WHERE u.role != 'admin' ${userId ? 'AND u.id = ?' : ''}
            GROUP BY u.id, u.full_name, u.username, u.base_salary, u.hourly_rate, u.overtime_rate
            ORDER BY u.full_name
        `;
        const queryParams = userId ? [month, userId] : [month];
        const [rows] = await db.query(baseQuery, queryParams);

        return rows.map(r => {
            const baseSalary = Number(r.base_salary) || 0;
            const totalHours = Number(r.total_hours) || 0;
            const totalOvertime = Number(r.total_overtime) || 0;
            const hourlyRate = Number(r.hourly_rate) || 0;
            const overtimeRate = Number(r.overtime_rate) || 0;

            const normalPay = totalHours * hourlyRate;
            const overtimePay = totalOvertime * overtimeRate;
            
            return { 
                ...r, 
                normal_pay: normalPay, 
                overtime_pay: overtimePay, 
                total_salary: normalPay + overtimePay 
            };
        });
    }
}

module.exports = Attendance;
