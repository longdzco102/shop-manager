const db = require('../config/db');

class Product {
    // Convert Google Drive sharing URLs to direct viewable URLs
    static convertDriveUrl(url) {
        if (!url) return url;
        // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
        let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
        // Pattern 2: https://drive.google.com/open?id=FILE_ID
        match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
        if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
        // Pattern 3: https://drive.google.com/uc?id=FILE_ID&export=...
        match = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
        if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
        // Pattern 4: https://drive.google.com/thumbnail?id=FILE_ID
        match = url.match(/drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
        if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
        return url;
    }

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
        const imageUrl = Product.convertDriveUrl(data.image_url) || '';
        const [result] = await db.query(
            'INSERT INTO products (name, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?)',
            [data.name, data.price, data.stock || 0, data.category || '', imageUrl]
        );
        return { id: result.insertId, ...data, image_url: imageUrl };
    }

    static async update(id, data) {
        const imageUrl = Product.convertDriveUrl(data.image_url);
        const [result] = await db.query(
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image_url = ? WHERE id = ?',
            [data.name, data.price, data.stock, data.category, imageUrl, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Clean up all child FK references before deleting
            await connection.query('DELETE FROM sale_items WHERE product_id = ?', [id]);
            await connection.query('DELETE FROM procurements WHERE product_id = ?', [id]);
            await connection.query('DELETE FROM product_discounts WHERE product_id = ?', [id]);
            await connection.query('DELETE FROM cart_items WHERE product_id = ?', [id]);
            const [result] = await connection.query('DELETE FROM products WHERE id = ?', [id]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async getCategories() {
        const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category != "" ORDER BY category');
        return rows.map(r => r.category);
    }
}

module.exports = Product;
