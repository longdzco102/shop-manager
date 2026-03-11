const db = require('../config/db');

class ProductDiscount {
    static async getActiveForProduct(productId) {
        const [rows] = await db.query(`
            SELECT * FROM product_discounts
            WHERE product_id = ? AND start_date <= NOW() AND end_date >= NOW()
            ORDER BY discount_percentage DESC LIMIT 1
        `, [productId]);
        return rows[0] || null;
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT pd.*, p.name as product_name
            FROM product_discounts pd
            JOIN products p ON pd.product_id = p.id
            ORDER BY pd.created_at DESC
        `);
        return rows;
    }

    static async create(data, createdBy) {
        const [result] = await db.query(`
            INSERT INTO product_discounts (product_id, discount_percentage, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, [data.product_id, data.discount_percentage, data.start_date, data.end_date, createdBy]);
        return { id: result.insertId };
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM product_discounts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ProductDiscount;
