const Cart = require('../models/Cart');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    if (!userId && !sessionId) throw new AppError('Cần đăng nhập hoặc session ID', 400);

    const items = await Cart.getCart(userId, sessionId);
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    res.json({ items, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
});

const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) throw new AppError('Dữ liệu không hợp lệ', 400);

    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    if (!userId && !sessionId) throw new AppError('Cần đăng nhập hoặc session ID', 400);

    const cartItemId = await Cart.addItem(productId, quantity, userId, sessionId);
    res.json({ message: 'Đã thêm vào giỏ hàng', cartItemId });
});

const updateItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) throw new AppError('Số lượng không hợp lệ', 400);
    await Cart.updateQuantity(req.params.id, quantity);
    res.json({ message: 'Cập nhật thành công' });
});

const removeItem = asyncHandler(async (req, res) => {
    await Cart.removeItem(req.params.id);
    res.json({ message: 'Đã xoá khỏi giỏ hàng' });
});

module.exports = { getCart, addToCart, updateItem, removeItem };
