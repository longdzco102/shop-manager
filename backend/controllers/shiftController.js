const Shift = require('../models/Shift');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// ============ SHIFT TYPES (Admin) ============
const getShiftTypes = asyncHandler(async (req, res) => {
    const types = await Shift.getShiftTypes();
    res.json(types);
});

const createShiftType = asyncHandler(async (req, res) => {
    const { name, start_time, end_time, pay_multiplier } = req.body;
    if (!name || !start_time || !end_time) throw new AppError('Tên, giờ bắt đầu và kết thúc là bắt buộc', 400);
    const result = await Shift.createShiftType(req.body);
    res.status(201).json({ ...result, message: 'Tạo loại ca thành công!' });
});

const updateShiftType = asyncHandler(async (req, res) => {
    const ok = await Shift.updateShiftType(req.params.id, req.body);
    if (!ok) throw new AppError('Không tìm thấy loại ca', 404);
    res.json({ message: 'Cập nhật loại ca thành công!' });
});

const deleteShiftType = asyncHandler(async (req, res) => {
    const ok = await Shift.deleteShiftType(req.params.id);
    if (!ok) throw new AppError('Không tìm thấy loại ca', 404);
    res.json({ message: 'Đã xóa loại ca!' });
});

// ============ SHIFT ASSIGNMENTS (Admin) ============
const getAssignments = asyncHandler(async (req, res) => {
    const data = await Shift.getAssignments({
        month: req.query.month,
        week_start: req.query.week_start,
        week_end: req.query.week_end,
        user_id: req.user.role !== 'admin' ? req.user.id : req.query.user_id
    });
    res.json(data);
});

const getAllAssignments = asyncHandler(async (req, res) => {
    // Tất cả NV đều xem được lịch toàn bộ
    const data = await Shift.getAssignments({
        month: req.query.month
    });
    res.json(data);
});

const createAssignment = asyncHandler(async (req, res) => {
    const { user_id, shift_type_id, work_date } = req.body;
    if (!user_id || !shift_type_id || !work_date) throw new AppError('Thiếu thông tin phân ca', 400);
    const result = await Shift.createAssignment(req.body);
    res.status(201).json({ ...result, message: 'Phân ca thành công!' });
});

const deleteAssignment = asyncHandler(async (req, res) => {
    const ok = await Shift.deleteAssignment(req.params.id);
    if (!ok) throw new AppError('Không tìm thấy', 404);
    res.json({ message: 'Đã xóa phân ca!' });
});

const autoSchedule = asyncHandler(async (req, res) => {
    const { month } = req.body;
    if (!month) throw new AppError('Cần chọn tháng (YYYY-MM)', 400);
    const result = await Shift.autoSchedule(month);
    res.json({ message: `Tự động sắp xếp thành công! Đã phân ${result.assigned} ca mới.`, ...result });
});

// ============ SHIFT REQUESTS (Staff) ============
const getRequests = asyncHandler(async (req, res) => {
    const filters = {
        month: req.query.month,
        status: req.query.status
    };
    // Staff chỉ xem đề xuất của mình, admin xem tất cả
    if (req.user.role !== 'admin') {
        filters.user_id = req.user.id;
    }
    const data = await Shift.getRequests(filters);
    res.json(data);
});

// Admin xem tất cả đề xuất (kể cả pending)
const getAllRequests = asyncHandler(async (req, res) => {
    const data = await Shift.getRequests({
        month: req.query.month,
        status: req.query.status
    });
    res.json(data);
});

const createRequest = asyncHandler(async (req, res) => {
    const { shift_type_id, work_date, note } = req.body;
    if (!shift_type_id || !work_date) throw new AppError('Chọn loại ca và ngày', 400);
    const result = await Shift.createRequest({
        user_id: req.user.id,
        shift_type_id,
        work_date,
        note
    });
    res.status(201).json({ ...result, message: 'Gửi đề xuất ca thành công!' });
});

const reviewRequest = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) throw new AppError('Status phải là approved hoặc rejected', 400);
    const ok = await Shift.reviewRequest(req.params.id, status, req.user.id);
    if (!ok) throw new AppError('Không tìm thấy đề xuất', 404);
    res.json({ message: status === 'approved' ? 'Đã duyệt đề xuất!' : 'Đã từ chối đề xuất!' });
});

// ============ OVERTIME (Admin) ============
const getOvertime = asyncHandler(async (req, res) => {
    const data = await Shift.getOvertime({ month: req.query.month });
    res.json(data);
});

const createOvertime = asyncHandler(async (req, res) => {
    const { user_id, work_date, hours, reason } = req.body;
    if (!user_id || !work_date || !hours) throw new AppError('Thiếu NV, ngày hoặc số giờ', 400);
    const result = await Shift.createOvertime({ ...req.body, created_by: req.user.id });
    res.status(201).json({ ...result, message: 'Đã thêm giờ làm thêm!' });
});

const deleteOvertime = asyncHandler(async (req, res) => {
    const ok = await Shift.deleteOvertime(req.params.id);
    if (!ok) throw new AppError('Không tìm thấy', 404);
    res.json({ message: 'Đã xóa!' });
});

// ============ PAYROLL ============
const getPayroll = asyncHandler(async (req, res) => {
    const { month } = req.query;
    if (!month) throw new AppError('Cần tháng (YYYY-MM)', 400);
    const payroll = await Shift.getPayroll(month);
    res.json(payroll);
});

module.exports = {
    getShiftTypes, createShiftType, updateShiftType, deleteShiftType,
    getAssignments, getAllAssignments, createAssignment, deleteAssignment, autoSchedule,
    getRequests, getAllRequests, createRequest, reviewRequest,
    getOvertime, createOvertime, deleteOvertime,
    getPayroll
};
