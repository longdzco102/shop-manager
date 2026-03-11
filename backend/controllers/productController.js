const Product = require('../models/Product');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const products = await Product.findAll({
        search: req.query.search,
        category: req.query.category
    });
    res.json(products);
});

const getOne = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found.', 404);
    res.json(product);
});

const create = asyncHandler(async (req, res) => {
    const result = await Product.create(req.body);
    res.status(201).json(result);
});

const update = asyncHandler(async (req, res) => {
    const updated = await Product.update(req.params.id, req.body);
    if (!updated) throw new AppError('Product not found.', 404);
    res.json({ id: parseInt(req.params.id), ...req.body });
});

const remove = asyncHandler(async (req, res) => {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) throw new AppError('Product not found.', 404);
    res.json({ message: 'Product deleted.' });
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Product.getCategories();
    res.json(categories);
});

module.exports = { getAll, getOne, create, update, remove, getCategories };
