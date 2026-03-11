const { AppError } = require('../utils/errorHandler');

const validateProduct = (req, res, next) => {
    const { name, price } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Tên sản phẩm không được để trống.', 400);
    }
    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
        throw new AppError('Giá sản phẩm phải là số dương.', 400);
    }
    if (req.body.stock !== undefined && (isNaN(req.body.stock) || Number(req.body.stock) < 0)) {
        throw new AppError('Tồn kho phải là số nguyên dương.', 400);
    }
    next();
};

module.exports = { validateProduct };
