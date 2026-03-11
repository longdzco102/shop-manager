const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Cart = require('../models/Cart');
const Discount = require('../models/Discount');
const db = require('../config/db');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getProducts = asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT p.id, p.name, p.price, p.stock, p.category, p.image_url,
            pd.discount_percentage
        FROM products p
        LEFT JOIN product_discounts pd ON p.id = pd.product_id
            AND pd.start_date <= NOW() AND pd.end_date >= NOW()
        WHERE p.stock > 0
        ORDER BY p.created_at DESC
    `);

    const products = rows.map(p => ({
        ...p,
        original_price: p.price,
        final_price: p.discount_percentage
            ? Math.round(p.price * (1 - p.discount_percentage / 100))
            : p.price,
        has_discount: !!p.discount_percentage
    }));
    res.json(products);
});

const getProductDetail = asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT p.*, pd.discount_percentage
        FROM products p
        LEFT JOIN product_discounts pd ON p.id = pd.product_id
            AND pd.start_date <= NOW() AND pd.end_date >= NOW()
        WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) throw new AppError('Sản phẩm không tồn tại', 404);
    const p = rows[0];
    res.json({
        ...p,
        original_price: p.price,
        final_price: p.discount_percentage ? Math.round(p.price * (1 - p.discount_percentage / 100)) : p.price,
        has_discount: !!p.discount_percentage
    });
});

const checkout = asyncHandler(async (req, res) => {
    const { shipping_name, shipping_phone, shipping_address, discount_code } = req.body;
    if (!shipping_name || !shipping_phone || !shipping_address) {
        throw new AppError('Vui lòng điền đầy đủ thông tin giao hàng', 400);
    }

    const userId = req.user.id;
    const cartItems = await Cart.getCart(userId);
    if (cartItems.length === 0) throw new AppError('Giỏ hàng trống', 400);

    // Check stock
    for (const item of cartItems) {
        if (item.stock < item.quantity) throw new AppError(`"${item.name}" không đủ tồn kho`, 400);
    }

    let totalAmount = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
    let discountAmount = 0;
    let discountId = null;

    // Apply discount code
    if (discount_code) {
        const validation = await Discount.validateDiscount(discount_code, totalAmount);
        if (!validation.valid) throw new AppError(validation.error, 400);
        discountAmount = Discount.calculateDiscountAmount(validation.discount, totalAmount);
        discountId = validation.discount.id;
    }

    const finalAmount = totalAmount - discountAmount;

    // Create order in transaction
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [saleResult] = await connection.query(
            `INSERT INTO sales (user_id, total, status, customer_name, customer_phone, discount_code, discount_amount, shipping_name, shipping_phone, shipping_address)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
            [userId, finalAmount, shipping_name, shipping_phone, discount_code || null, discountAmount,
             shipping_name, shipping_phone, shipping_address]
        );
        const saleId = saleResult.insertId;

        for (const item of cartItems) {
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [saleId, item.product_id, item.quantity, item.final_price]
            );
            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        if (discountId) {
            await connection.query(
                'INSERT INTO discount_usage (discount_id, sale_id, discount_amount) VALUES (?, ?, ?)',
                [discountId, saleId, discountAmount]
            );
            await connection.query('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?', [discountId]);
        }

        await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        await connection.commit();

        res.status(201).json({ message: 'Đặt hàng thành công!', orderId: saleId, finalAmount });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    const [orders] = await db.query(`
        SELECT s.id, s.total, s.status, s.created_at, s.shipping_name, s.discount_code, s.discount_amount,
            (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
        FROM sales s WHERE s.user_id = ? ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(orders);
});

const getOrderDetail = asyncHandler(async (req, res) => {
    const [orders] = await db.query('SELECT * FROM sales WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (orders.length === 0) throw new AppError('Đơn hàng không tồn tại', 404);

    const [items] = await db.query(`
        SELECT si.*, p.name, p.image_url FROM sale_items si
        JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?
    `, [req.params.id]);

    res.json({ order: orders[0], items });
});

module.exports = { getProducts, getProductDetail, checkout, getMyOrders, getOrderDetail };
