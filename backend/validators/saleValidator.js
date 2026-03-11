const { AppError } = require('../utils/errorHandler');

const validateSale = (req, res, next) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Đơn hàng phải có ít nhất một sản phẩm.', 400);
    }
    for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
            throw new AppError('Mỗi sản phẩm phải có ID và số lượng hợp lệ.', 400);
        }
    }
    next();
};

const validateOnlineOrder = (req, res, next) => {
    const { customer_name, customer_phone, items } = req.body;
    if (!customer_name || customer_name.trim() === '') {
        throw new AppError('Thiếu tên khách hàng.', 400);
    }
    if (!customer_phone || customer_phone.trim() === '') {
        throw new AppError('Thiếu số điện thoại.', 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Giỏ hàng trống.', 400);
    }
    next();
};

const validateStatus = (req, res, next) => {
    const { status } = req.body;
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
        throw new AppError('Trạng thái không hợp lệ.', 400);
    }
    next();
};

module.exports = { validateSale, validateOnlineOrder, validateStatus };
