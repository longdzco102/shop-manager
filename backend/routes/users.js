const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
