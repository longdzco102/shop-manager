const Expense = require('../models/Expense');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const expenses = await Expense.findAll(req.query.category);
    res.json(expenses);
});

const create = asyncHandler(async (req, res) => {
    const result = await Expense.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(result);
});

const remove = asyncHandler(async (req, res) => {
    const deleted = await Expense.delete(req.params.id);
    if (!deleted) throw new AppError('Expense not found.', 404);
    res.json({ message: 'Expense deleted.' });
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Expense.getCategories();
    res.json(categories);
});

module.exports = { getAll, create, remove, getCategories };
