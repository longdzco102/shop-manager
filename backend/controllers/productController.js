const db = require('../config/db');

// Get all products (with optional search)
async function getAll(req, res) {
    try {
        const { search, category } = req.query;
        let sql = 'SELECT * FROM products';
        const params = [];

        const conditions = [];
        if (search) {
            conditions.push('name LIKE ?');
            params.push(`%${search}%`);
        }
        if (category) {
            conditions.push('category = ?');
            params.push(category);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get single product
async function getOne(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create product
async function create(req, res) {
    try {
        const { name, price, stock, category } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required.' });
        }
        const [result] = await db.query(
            'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)',
            [name, price, stock || 0, category || '']
        );
        res.status(201).json({ id: result.insertId, name, price, stock: stock || 0, category: category || '' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Update product
async function update(req, res) {
    try {
        const { name, price, stock, category } = req.body;
        const [result] = await db.query(
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ? WHERE id = ?',
            [name, price, stock, category, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
        res.json({ id: parseInt(req.params.id), name, price, stock, category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Delete product
async function remove(req, res) {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get categories
async function getCategories(req, res) {
    try {
        const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category != "" ORDER BY category');
        res.json(rows.map(r => r.category));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAll, getOne, create, update, remove, getCategories };
