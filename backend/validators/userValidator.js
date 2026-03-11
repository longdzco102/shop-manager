const { AppError } = require('../utils/errorHandler');

const validateRegister = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.trim() === '') {
        throw new AppError('Tên đăng nhập không được để trống.', 400);
    }
    if (!password || password.length < 3) {
        throw new AppError('Mật khẩu phải có ít nhất 3 ký tự.', 400);
    }
    if (req.body.role && !['admin', 'staff'].includes(req.body.role)) {
        throw new AppError('Vai trò không hợp lệ (admin hoặc staff).', 400);
    }
    next();
};

const validateUpdate = (req, res, next) => {
    const { role } = req.body;
    if (role && !['admin', 'staff'].includes(role)) {
        throw new AppError('Vai trò không hợp lệ (admin hoặc staff).', 400);
    }
    next();
};

module.exports = { validateRegister, validateUpdate };
