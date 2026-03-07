const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/categories', authenticate, ctrl.getCategories);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.put('/:id', authenticate, requireAdmin, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
