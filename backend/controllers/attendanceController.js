const db = require('../config/db');

// Get all attendance records (with optional month filter)
async function getAll(req, res) {
    try {
        const { month, user_id } = req.query;
        let sql = `
            SELECT a.*, u.full_name, u.username 
            FROM attendance a
            JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (month) {
            conditions.push('DATE_FORMAT(a.work_date, "%Y-%m") = ?');
            params.push(month);
        }
        if (user_id) {
            conditions.push('a.user_id = ?');
            params.push(user_id);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY a.work_date DESC, a.user_id';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create attendance record
async function create(req, res) {
    try {
        const { user_id, work_date, hours_worked, overtime_hours, note } = req.body;

        if (!user_id || !work_date || hours_worked === undefined) {
            return res.status(400).json({ error: 'User, date, and hours are required.' });
        }

        // Check for duplicate
        const [existing] = await db.query(
            'SELECT id FROM attendance WHERE user_id = ? AND work_date = ?',
            [user_id, work_date]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Nhân viên này đã được chấm công cho ngày này rồi.' });
        }

        const [result] = await db.query(
            'INSERT INTO attendance (user_id, work_date, hours_worked, overtime_hours, note) VALUES (?, ?, ?, ?, ?)',
            [user_id, work_date, hours_worked, overtime_hours || 0, note || '']
        );

        res.status(201).json({ id: result.insertId, message: 'Chấm công thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get payroll summary for a month
async function getPayroll(req, res) {
    try {
        const { month } = req.query;
        if (!month) {
            return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' });
        }

        const sql = `
            SELECT 
                u.id as user_id,
                u.full_name,
                u.username,
                COUNT(a.id) as total_days,
                COALESCE(SUM(a.hours_worked), 0) as total_hours,
                COALESCE(SUM(a.overtime_hours), 0) as total_overtime,
                COALESCE(u.base_salary, 0) as base_salary,
                COALESCE(u.hourly_rate, 0) as hourly_rate,
                COALESCE(u.overtime_rate, 0) as overtime_rate
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND DATE_FORMAT(a.work_date, "%Y-%m") = ?
            WHERE u.role != 'admin'
            GROUP BY u.id, u.full_name, u.username, u.base_salary, u.hourly_rate, u.overtime_rate
            ORDER BY u.full_name
        `;

        const [rows] = await db.query(sql, [month]);

        // Calculate salary for each user
        const payroll = rows.map(r => {
            const normalPay = r.total_hours * r.hourly_rate;
            const overtimePay = r.total_overtime * r.overtime_rate;
            const totalSalary = r.base_salary + normalPay + overtimePay;
            return {
                ...r,
                normal_pay: normalPay,
                overtime_pay: overtimePay,
                total_salary: totalSalary
            };
        });

        res.json(payroll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Delete attendance record
async function remove(req, res) {
    try {
        const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Record not found.' });
        res.json({ message: 'Deleted attendance record.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAll, create, getPayroll, remove };
