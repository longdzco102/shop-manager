const Attendance = require('../models/Attendance');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
    const records = await Attendance.findAll({
        month: req.query.month,
        user_id: userId
    });
    res.json(records);
});

// Tất cả nhân viên đều có thể xem lịch ca toàn cửa hàng (chỉ đọc)
const getStoreSchedule = asyncHandler(async (req, res) => {
    const records = await Attendance.findAll({
        month: req.query.month
        // Không lọc user_id → trả toàn bộ
    });
    res.json(records);
});

const create = asyncHandler(async (req, res) => {
    const { user_id, work_date, hours_worked } = req.body;
    if (!user_id || !work_date || hours_worked === undefined) {
        throw new AppError('User, date, and hours are required.', 400);
    }
    
    if (req.user.role !== 'admin' && parseInt(user_id) !== req.user.id) {
        throw new AppError('Không được quyền chấm công cho người khác.', 403);
    }

    const isDuplicate = await Attendance.checkDuplicate(user_id, work_date);
    if (isDuplicate) throw new AppError('Nhân viên này đã được chấm công cho ngày này rồi.', 400);

    const result = await Attendance.create(req.body);
    res.status(201).json({ ...result, message: 'Chấm công thành công!' });
});

const getPayroll = asyncHandler(async (req, res) => {
    const { month } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    if (!month) throw new AppError('Month is required (format: YYYY-MM)', 400);
    const payroll = await Attendance.getPayroll(month, userId);
    res.json(payroll);
});

const update = asyncHandler(async (req, res) => {
    const updated = await Attendance.update(req.params.id, req.body);
    if (!updated) throw new AppError('Record not found.', 404);
    res.json({ message: 'Cập nhật chấm công thành công!' });
});

const remove = asyncHandler(async (req, res) => {
    const deleted = await Attendance.delete(req.params.id);
    if (!deleted) throw new AppError('Record not found.', 404);
    res.json({ message: 'Deleted attendance record.' });
});

module.exports = { getAll, getStoreSchedule, create, getPayroll, update, remove };
