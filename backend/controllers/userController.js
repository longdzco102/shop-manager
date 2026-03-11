const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

const remove = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) throw new AppError('Cannot delete your own account.', 400);
    const deleted = await User.delete(userId);
    if (!deleted) throw new AppError('User not found.', 404);
    res.json({ message: 'User deleted.' });
});

const update = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { full_name, role, base_salary, hourly_rate, overtime_rate } = req.body;

    if (userId === req.user.id && role !== 'admin') {
        throw new AppError('Cannot demote yourself.', 400);
    }

    const updated = await User.update(userId, { full_name, role, base_salary, hourly_rate, overtime_rate });
    if (!updated) throw new AppError('User not found.', 404);
    res.json({ message: 'User updated.' });
});

module.exports = { getAll, remove, update };
