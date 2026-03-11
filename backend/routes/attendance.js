const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', attendanceController.getAll);
router.get('/payroll', attendanceController.getPayroll);
router.post('/', attendanceController.create);
router.put('/:id', requireAdmin, attendanceController.update);
router.delete('/:id', requireAdmin, attendanceController.remove);

module.exports = router;
