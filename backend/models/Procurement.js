const db = require('../config/db');

class Procurement {
    static async findAll() {
        const [rows] = await db.query(`
            SELECT pr.*, p.name as product_name 
            FROM procurements pr
            JOIN products p ON pr.product_id = p.id
            ORDER BY pr.created_at DESC
        `);
        return rows;
    }

    static async create(data) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                'INSERT INTO procurements (product_id, quantity, purchase_price, supplier, procurement_date) VALUES (?, ?, ?, ?, ?)',
                [data.product_id, data.quantity, data.purchase_price, data.supplier || '', data.procurement_date || new Date()]
            );

            await connection.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [data.quantity, data.product_id]
            );

            await connection.commit();
            return { id: result.insertId };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = Procurement;
