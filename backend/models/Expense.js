const db = require('../config/db');

class Expense {
    static async findAll(category) {
        let sql = `SELECT e.*, u.username, u.full_name 
                    FROM expenses e 
                    JOIN users u ON e.created_by = u.id`;
        const params = [];

        if (category) {
            sql += ' WHERE e.category = ?';
            params.push(category);
        }
        sql += ' ORDER BY e.date DESC, e.created_at DESC';

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async create(data) {
        const [result] = await db.query(
            'INSERT INTO expenses (title, amount, category, date, created_by) VALUES (?, ?, ?, ?, ?)',
            [data.title, data.amount, data.category || '', data.date, data.created_by]
        );
        return { id: result.insertId, ...data };
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getCategories() {
        const [rows] = await db.query('SELECT DISTINCT category FROM expenses WHERE category != "" ORDER BY category');
        return rows.map(r => r.category);
    }
}

module.exports = Expense;
