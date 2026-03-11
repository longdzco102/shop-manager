const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const register = asyncHandler(async (req, res) => {
    const { username, password, full_name } = req.body;
    if (!username || !password) throw new AppError('Tên đăng nhập và mật khẩu là bắt buộc', 400);
    if (password.length < 3) throw new AppError('Mật khẩu tối thiểu 3 ký tự', 400);

    const existing = await User.findByUsername(username);
    if (existing) throw new AppError('Tên đăng nhập đã tồn tại', 400);

    const hash = await bcrypt.hash(password, 10);
    const result = await User.create({
        username, password: hash, full_name: full_name || username, role: 'customer'
    });

    const token = jwt.sign(
        { id: result.id, username, role: 'customer', full_name: full_name || username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Transfer guest cart to new user if session ID provided
    const sessionId = req.headers['x-session-id'];
    if (sessionId) await Cart.transferCart(sessionId, result.id);

    res.status(201).json({ token, user: { id: result.id, username, full_name: full_name || username, role: 'customer' } });
});

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError('Thiếu tên đăng nhập hoặc mật khẩu', 400);

    const user = await User.findByUsername(username);
    if (!user || user.role !== 'customer') throw new AppError('Tài khoản không tồn tại', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Mật khẩu không đúng', 401);

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Transfer guest cart
    const sessionId = req.headers['x-session-id'];
    if (sessionId) await Cart.transferCart(sessionId, user.id);

    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
});

module.exports = { register, login };
