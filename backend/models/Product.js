const db = require('../config/db');

class Product {
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM products';
        const params = [];
        const conditions = [];

        if (filters.search) {
            conditions.push('name LIKE ?');
            params.push(`%${filters.search}%`);
        }
        if (filters.category) {
            conditions.push('category = ?');
            params.push(filters.category);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findPublicAvailable() {
        const [rows] = await db.query(
            'SELECT id, name, price, stock, category, image_url FROM products WHERE stock > 0 ORDER BY created_at DESC'
        );
        return rows;
    }

    static async create(data) {
        const [result] = await db.query(
            'INSERT INTO products (name, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?)',
            [data.name, data.price, data.stock || 0, data.category || '', data.image_url || '']
        );
        return { id: result.insertId, ...data };
    }

    static async update(id, data) {
        const [result] = await db.query(
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image_url = ? WHERE id = ?',
            [data.name, data.price, data.stock, data.category, data.image_url, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getCategories() {
        const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category != "" ORDER BY category');
        return rows.map(r => r.category);
    }
}

module.exports = Product;
