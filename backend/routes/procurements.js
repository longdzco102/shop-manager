const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All procurement routes require authentication
router.use(authenticate);

router.get('/', procurementController.getAll);
router.post('/', requireAdmin, procurementController.create);

module.exports = router;
