const db = require('../config/db');

// Get all procurements
async function getAll(req, res) {
    try {
        const sql = `
            SELECT pr.*, p.name as product_name 
            FROM procurements pr
            JOIN products p ON pr.product_id = p.id
            ORDER BY pr.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create procurement (Import stock)
async function create(req, res) {
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const { product_id, quantity, purchase_price, supplier, procurement_date } = req.body;

        if (!product_id || !quantity || !purchase_price) {
            throw new Error('Product, quantity, and purchase price are required.');
        }

        // 1. Insert procurement record
        const [result] = await conn.query(
            'INSERT INTO procurements (product_id, quantity, purchase_price, supplier, procurement_date) VALUES (?, ?, ?, ?, ?)',
            [product_id, quantity, purchase_price, supplier || '', procurement_date || new Date()]
        );

        // 2. Update product stock
        await conn.query(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [quantity, product_id]
        );

        await conn.commit();
        res.status(201).json({ id: result.insertId, message: 'Stock imported successfully.' });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { getAll, create };
