const db = require('../config/db');

// Get all sales
async function getAll(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get single sale with items
async function getOne(req, res) {
    try {
        const [sales] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (sales.length === 0) return res.status(404).json({ error: 'Sale not found.' });

        const [items] = await db.query(`
            SELECT si.*, p.name as product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [req.params.id]);

        res.json({ ...sales[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create sale
async function create(req, res) {
    console.log('📦 Create Sale Request Received:', JSON.stringify(req.body));
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { items } = req.body; // [{ product_id, quantity }]
        if (!items || items.length === 0) {
            console.log('⚠️ No items in request');
            return res.status(400).json({ error: 'At least one item is required.' });
        }

        let total = 0;

        // Validate stock and calculate total
        for (const item of items) {
            console.log(`🔍 Checking product ID: ${item.product_id}`);
            const [products] = await connection.query(
                'SELECT * FROM products WHERE id = ?', [item.product_id]
            );
            if (products.length === 0) {
                console.log(`❌ Product ${item.product_id} not found`);
                await connection.rollback();
                return res.status(400).json({ error: `Product ${item.product_id} not found.` });
            }
            if (products[0].stock < item.quantity) {
                console.log(`❌ Insufficient stock for ${products[0].name}. Have: ${products[0].stock}, Need: ${item.quantity}`);
                await connection.rollback();
                return res.status(400).json({ error: `Not enough stock for "${products[0].name}". Available: ${products[0].stock}` });
            }
            item.price = products[0].price;
            total += products[0].price * item.quantity;
        }

        // Create sale
        console.log(`💰 Creating sale record, total: ${total}, user: ${req.user.id}`);
        const [saleResult] = await connection.query(
            'INSERT INTO sales (user_id, total) VALUES (?, ?)',
            [req.user.id, total]
        );
        const saleId = saleResult.insertId;

        // Create sale items and deduct stock
        for (const item of items) {
            console.log(`📝 Inserting sale item: prod ${item.product_id}, qty ${item.quantity}`);
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [saleId, item.product_id, item.quantity, item.price]
            );
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();
        console.log(`✅ Sale created successfully: #${saleId}`);
        res.status(201).json({ id: saleId, total, items });
    } catch (err) {
        console.error('🔥 Sale creation error:', err);
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { getAll, getOne, create };
