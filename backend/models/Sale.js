const db = require('../config/db');

class Sale {
    static async findAll() {
        const [rows] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);
        return rows;
    }

    static async findById(id) {
        const [sales] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [id]);
        if (sales.length === 0) return null;

        const [items] = await db.query(`
            SELECT si.*, p.name as product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [id]);

        return { ...sales[0], items };
    }

    static async create(userId, items) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            let total = 0;

            for (const item of items) {
                const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [item.product_id]);
                if (products.length === 0) throw new Error(`Product ${item.product_id} not found.`);
                if (products[0].stock < item.quantity) {
                    throw new Error(`Not enough stock for "${products[0].name}". Available: ${products[0].stock}`);
                }
                item.price = products[0].price;
                total += products[0].price * item.quantity;
            }

            const [saleResult] = await connection.query(
                'INSERT INTO sales (user_id, total) VALUES (?, ?)', [userId, total]
            );
            const saleId = saleResult.insertId;

            for (const item of items) {
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
            return { id: saleId, total, items };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async createOnlineOrder(data) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { customer_name, customer_phone, items } = data;

            const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
            const defaultUserId = admins.length > 0 ? admins[0].id : 1;

            let total = 0;
            for (let item of items) {
                const [products] = await connection.query('SELECT price, stock FROM products WHERE id = ?', [item.product_id]);
                if (products.length === 0) throw new Error(`Sản phẩm #${item.product_id} không tồn tại.`);
                if (products[0].stock < item.quantity) throw new Error(`Sản phẩm không đủ tồn kho.`);
                item.price = products[0].price;
                total += item.price * item.quantity;
            }

            const [saleResult] = await connection.query(
                'INSERT INTO sales (user_id, total, status, customer_name, customer_phone) VALUES (?, ?, "pending", ?, ?)',
                [defaultUserId, total, customer_name, customer_phone]
            );
            const saleId = saleResult.insertId;

            for (let item of items) {
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
            return { id: saleId, total };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async updateStatus(id, status) {
        const [result] = await db.query('UPDATE sales SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Clean up child FK references
            await connection.query('DELETE FROM discount_usage WHERE sale_id = ?', [id]);
            await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);
            const [result] = await connection.query('DELETE FROM sales WHERE id = ?', [id]);
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

module.exports = Sale;
