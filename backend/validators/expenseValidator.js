const { AppError } = require('../utils/errorHandler');

const validateExpense = (req, res, next) => {
    const { title, amount, date } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new AppError('Tiêu đề chi phí không được để trống.', 400);
    }
    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
        throw new AppError('Số tiền phải là số dương.', 400);
    }
    if (!date) {
        throw new AppError('Ngày chi phí là bắt buộc.', 400);
    }
    next();
};

module.exports = { validateExpense };
