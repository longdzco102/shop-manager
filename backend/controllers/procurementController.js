const Procurement = require('../models/Procurement');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const procurements = await Procurement.findAll();
    res.json(procurements);
});

const create = asyncHandler(async (req, res) => {
    const { product_id, quantity, purchase_price } = req.body;
    if (!product_id || !quantity || !purchase_price) {
        throw new AppError('Product, quantity, and purchase price are required.', 400);
    }
    const result = await Procurement.create(req.body);
    res.status(201).json({ ...result, message: 'Stock imported successfully.' });
});

module.exports = { getAll, create };
