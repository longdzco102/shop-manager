const Sale = require('../models/Sale');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const sales = await Sale.findAll();
    res.json(sales);
});

const getOne = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) throw new AppError('Sale not found.', 404);
    res.json(sale);
});

const create = asyncHandler(async (req, res) => {
    const result = await Sale.create(req.user.id, req.body.items);
    res.status(201).json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
    const updated = await Sale.updateStatus(parseInt(req.params.id), req.body.status);
    if (!updated) throw new AppError('Sale not found.', 404);
    res.json({ message: 'Order status updated successfully' });
});

const remove = asyncHandler(async (req, res) => {
    const deleted = await Sale.delete(parseInt(req.params.id));
    if (!deleted) throw new AppError('Sale not found.', 404);
    res.json({ message: 'Đã xóa đơn hàng.' });
});

module.exports = { getAll, getOne, create, updateStatus, remove };
