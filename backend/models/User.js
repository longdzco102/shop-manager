const db = require('../config/db');

class User {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, full_name, role, base_salary, hourly_rate, overtime_rate, created_at FROM users WHERE id = ?', [id]
        );
        return rows[0] || null;
    }

    static async findAll() {
        const [rows] = await db.query(
            'SELECT id, username, full_name, role, base_salary, hourly_rate, overtime_rate, created_at FROM users WHERE role != ? ORDER BY created_at DESC',
            ['customer']
        );
        return rows;
    }

    static async create(data) {
        const [result] = await db.query(
            'INSERT INTO users (username, password, full_name, role, base_salary, hourly_rate, overtime_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [data.username, data.password, data.full_name || '', data.role || 'staff',
             data.base_salary || 0, data.hourly_rate || 25000, data.overtime_rate || 37500]
        );
        return { id: result.insertId, username: data.username, full_name: data.full_name, role: data.role || 'staff' };
    }

    static async update(id, data) {
        const [result] = await db.query(
            'UPDATE users SET full_name = ?, role = ?, base_salary = ?, hourly_rate = ?, overtime_rate = ? WHERE id = ?',
            [data.full_name, data.role, data.base_salary || 0, data.hourly_rate || 25000, data.overtime_rate || 37500, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
