const db = require('../config/db');

// Get all expenses
async function getAll(req, res) {
    try {
        const { category } = req.query;
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
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create expense
async function create(req, res) {
    try {
        const { title, amount, category, date } = req.body;
        if (!title || amount === undefined || !date) {
            return res.status(400).json({ error: 'Title, amount, and date are required.' });
        }
        const [result] = await db.query(
            'INSERT INTO expenses (title, amount, category, date, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, amount, category || '', date, req.user.id]
        );
        res.status(201).json({ id: result.insertId, title, amount, category, date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Delete expense (admin only)
async function remove(req, res) {
    try {
        const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found.' });
        res.json({ message: 'Expense deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get expense categories
async function getCategories(req, res) {
    try {
        const [rows] = await db.query('SELECT DISTINCT category FROM expenses WHERE category != "" ORDER BY category');
        res.json(rows.map(r => r.category));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAll, create, remove, getCategories };
