const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateExpense } = require('../validators/expenseValidator');

router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.get('/categories', authenticate, requireAdmin, ctrl.getCategories);
router.post('/', authenticate, requireAdmin, validateExpense, ctrl.create);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
