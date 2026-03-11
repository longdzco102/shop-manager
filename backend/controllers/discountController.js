const Discount = require('../models/Discount');
const ProductDiscount = require('../models/ProductDiscount');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getActive = asyncHandler(async (req, res) => {
    const discounts = await Discount.getActiveDiscounts();
    res.json(discounts);
});

const validate = asyncHandler(async (req, res) => {
    const { code, orderAmount } = req.body;
    if (!code) throw new AppError('Vui lòng nhập mã giảm giá', 400);

    const result = await Discount.validateDiscount(code, orderAmount || 0);
    if (!result.valid) throw new AppError(result.error, 400);

    const discountAmount = Discount.calculateDiscountAmount(result.discount, orderAmount);
    res.json({
        valid: true,
        discount: { id: result.discount.id, code: result.discount.code, name: result.discount.name, type: result.discount.type, value: result.discount.value },
        discountAmount,
        finalAmount: orderAmount - discountAmount
    });
});

const getAll = asyncHandler(async (req, res) => {
    const discounts = await Discount.getAll();
    res.json(discounts);
});

const create = asyncHandler(async (req, res) => {
    const result = await Discount.create(req.body, req.user.id);
    res.status(201).json({ ...result, message: 'Tạo mã giảm giá thành công' });
});

const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'inactive', 'expired'].includes(status)) throw new AppError('Trạng thái không hợp lệ', 400);
    const updated = await Discount.updateStatus(req.params.id, status);
    if (!updated) throw new AppError('Không tìm thấy mã giảm giá', 404);
    res.json({ message: 'Cập nhật thành công' });
});

const remove = asyncHandler(async (req, res) => {
    const deleted = await Discount.delete(req.params.id);
    if (!deleted) throw new AppError('Không tìm thấy mã giảm giá', 404);
    res.json({ message: 'Đã xoá mã giảm giá' });
});

// Product Discounts
const getProductDiscounts = asyncHandler(async (req, res) => {
    const list = await ProductDiscount.getAll();
    res.json(list);
});

const createProductDiscount = asyncHandler(async (req, res) => {
    const result = await ProductDiscount.create(req.body, req.user.id);
    res.status(201).json({ ...result, message: 'Tạo giảm giá sản phẩm thành công' });
});

const removeProductDiscount = asyncHandler(async (req, res) => {
    const deleted = await ProductDiscount.delete(req.params.id);
    if (!deleted) throw new AppError('Không tìm thấy', 404);
    res.json({ message: 'Đã xoá giảm giá sản phẩm' });
});

module.exports = { getActive, validate, getAll, create, updateStatus, remove, getProductDiscounts, createProductDiscount, removeProductDiscount };
