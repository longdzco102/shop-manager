const db = require('../config/db');

class Discount {
    static async getActiveDiscounts() {
        const [rows] = await db.query(`
            SELECT id, code, name, type, value, min_purchase, max_discount, start_date, end_date
            FROM discounts 
            WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date >= NOW()
            AND (usage_limit IS NULL OR used_count < usage_limit)
        `);
        return rows;
    }

    static async findByCode(code) {
        const [rows] = await db.query('SELECT * FROM discounts WHERE code = ?', [code]);
        return rows[0] || null;
    }

    static async validateDiscount(code, orderAmount) {
        const discount = await this.findByCode(code);
        if (!discount) return { valid: false, error: 'Mã giảm giá không tồn tại' };
        if (discount.status !== 'active') return { valid: false, error: 'Mã giảm giá không còn hiệu lực' };

        const now = new Date();
        if (new Date(discount.start_date) > now || new Date(discount.end_date) < now) {
            return { valid: false, error: 'Mã giảm giá đã hết hạn' };
        }
        if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
            return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
        }
        if (orderAmount < discount.min_purchase) {
            return { valid: false, error: `Đơn hàng tối thiểu ${Number(discount.min_purchase).toLocaleString('vi-VN')}đ` };
        }
        return { valid: true, discount };
    }

    static calculateDiscountAmount(discount, orderAmount) {
        let amount = 0;
        if (discount.type === 'percentage') {
            amount = (orderAmount * discount.value) / 100;
            if (discount.max_discount && amount > Number(discount.max_discount)) {
                amount = Number(discount.max_discount);
            }
        } else {
            amount = Number(discount.value);
        }
        return Math.min(amount, orderAmount);
    }

    static async create(data, createdBy) {
        const [result] = await db.query(`
            INSERT INTO discounts (code, name, type, value, min_purchase, max_discount, start_date, end_date, usage_limit, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [data.code, data.name, data.type, data.value, data.min_purchase || 0,
            data.max_discount || null, data.start_date, data.end_date, data.usage_limit || null, createdBy]);
        return { id: result.insertId };
    }

    static async getAll() {
        const [rows] = await db.query('SELECT * FROM discounts ORDER BY created_at DESC');
        return rows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query('UPDATE discounts SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM discounts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async incrementUsage(id) {
        await db.query('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?', [id]);
    }
}

module.exports = Discount;
