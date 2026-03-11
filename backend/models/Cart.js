const db = require('../config/db');

class Cart {
    static async getCart(userId = null, sessionId = null) {
        let where = '';
        let params = [];
        if (userId) { where = 'c.user_id = ?'; params.push(userId); }
        else if (sessionId) { where = 'c.session_id = ?'; params.push(sessionId); }
        else return [];

        const [rows] = await db.query(`
            SELECT c.id, c.quantity, c.product_id,
                   p.name, p.price, p.image_url, p.stock,
                   pd.discount_percentage
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            LEFT JOIN product_discounts pd ON p.id = pd.product_id
                AND pd.start_date <= NOW() AND pd.end_date >= NOW()
            WHERE ${where}
        `, params);

        return rows.map(item => {
            const finalPrice = item.discount_percentage
                ? item.price * (1 - item.discount_percentage / 100)
                : item.price;
            return {
                ...item,
                original_price: item.price,
                final_price: Math.round(finalPrice),
                subtotal: Math.round(finalPrice * item.quantity)
            };
        });
    }

    static async addItem(productId, quantity, userId = null, sessionId = null) {
        let checkWhere = 'product_id = ? AND ';
        let params = [productId];
        if (userId) { checkWhere += 'user_id = ?'; params.push(userId); }
        else { checkWhere += 'session_id = ?'; params.push(sessionId); }

        const [existing] = await db.query(`SELECT id, quantity FROM cart_items WHERE ${checkWhere}`, params);

        if (existing.length > 0) {
            await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
            return existing[0].id;
        } else {
            const [result] = await db.query(
                'INSERT INTO cart_items (product_id, quantity, user_id, session_id) VALUES (?, ?, ?, ?)',
                [productId, quantity, userId, sessionId]
            );
            return result.insertId;
        }
    }

    static async updateQuantity(cartItemId, quantity) {
        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
    }

    static async removeItem(cartItemId) {
        await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    }

    static async clearCart(userId = null, sessionId = null) {
        if (userId) await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        else if (sessionId) await db.query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
    }

    static async transferCart(sessionId, userId) {
        // Merge: if user already has same product in cart, sum quantities
        const [sessionItems] = await db.query('SELECT * FROM cart_items WHERE session_id = ?', [sessionId]);
        for (const item of sessionItems) {
            const [existing] = await db.query(
                'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, item.product_id]
            );
            if (existing.length > 0) {
                await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [item.quantity, existing[0].id]);
                await db.query('DELETE FROM cart_items WHERE id = ?', [item.id]);
            } else {
                await db.query('UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?', [userId, item.id]);
            }
        }
    }
}

module.exports = Cart;
