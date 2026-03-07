const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/categories', authenticate, ctrl.getCategories);
router.post('/', authenticate, ctrl.create);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
