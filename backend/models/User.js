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
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Clean up all child FK references
            // sale_items references sales(id) ON DELETE CASCADE, so deleting sales auto-removes sale_items
            // But sale_items also references products(id), so we delete sale_items first for user's sales
            const [userSales] = await connection.query('SELECT id FROM sales WHERE user_id = ?', [id]);
            if (userSales.length > 0) {
                const saleIds = userSales.map(s => s.id);
                await connection.query(`DELETE FROM discount_usage WHERE sale_id IN (?)`, [saleIds]);
                await connection.query(`DELETE FROM sale_items WHERE sale_id IN (?)`, [saleIds]);
                await connection.query('DELETE FROM sales WHERE user_id = ?', [id]);
            }
            await connection.query('DELETE FROM expenses WHERE created_by = ?', [id]);
            await connection.query('DELETE FROM cart_items WHERE user_id = ?', [id]);
            // Shift management tables already have ON DELETE CASCADE, but just to be safe
            await connection.query('DELETE FROM shift_assignments WHERE user_id = ?', [id]);
            await connection.query('DELETE FROM shift_requests WHERE user_id = ?', [id]);
            await connection.query('DELETE FROM overtime_records WHERE user_id = ?', [id]);
            const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = User;
