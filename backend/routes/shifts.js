const router = require('express').Router();
const ctrl = require('../controllers/shiftController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// Shift Types - public read, admin write
router.get('/types', ctrl.getShiftTypes);
router.post('/types', requireAdmin, ctrl.createShiftType);
router.put('/types/:id', requireAdmin, ctrl.updateShiftType);
router.delete('/types/:id', requireAdmin, ctrl.deleteShiftType);

// Shift Assignments
router.get('/assignments', ctrl.getAssignments);           // Staff: own, Admin: all or filtered
router.get('/assignments/all', ctrl.getAllAssignments);     // Tất cả NV xem lịch toàn bộ
router.post('/assignments', requireAdmin, ctrl.createAssignment);
router.delete('/assignments/:id', requireAdmin, ctrl.deleteAssignment);
router.post('/assignments/auto', requireAdmin, ctrl.autoSchedule);

// Shift Requests (Staff gửi, Admin duyệt)
router.get('/requests', ctrl.getRequests);
router.get('/requests/all', requireAdmin, ctrl.getAllRequests);
router.post('/requests', ctrl.createRequest);
router.put('/requests/:id/review', requireAdmin, ctrl.reviewRequest);

// Overtime (Admin only)
router.get('/overtime', ctrl.getOvertime);
router.post('/overtime', requireAdmin, ctrl.createOvertime);
router.delete('/overtime/:id', requireAdmin, ctrl.deleteOvertime);

// Payroll
router.get('/payroll', ctrl.getPayroll);

module.exports = router;
