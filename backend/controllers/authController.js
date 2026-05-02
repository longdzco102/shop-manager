const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError('Vui lòng nhập tên đăng nhập và mật khẩu.', 400);

    const user = await User.findByUsername(username);
    if (!user) throw new AppError('Sai thông tin đăng nhập. Vui lòng thử lại.', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Sai thông tin đăng nhập. Vui lòng thử lại.', 401);

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name }
    });
});

const register = asyncHandler(async (req, res) => {
    const { username, password, full_name, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await User.create({
        username, password: hash, full_name, role,
        base_salary: req.body.base_salary,
        hourly_rate: req.body.hourly_rate,
        overtime_rate: req.body.overtime_rate
    });
    res.status(201).json(result);
});

const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 404);
    res.json(user);
});

module.exports = { login, register, getProfile };
