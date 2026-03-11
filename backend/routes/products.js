const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateProduct } = require('../validators/productValidator');

router.get('/categories', authenticate, ctrl.getCategories);
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, requireAdmin, validateProduct, ctrl.create);
router.put('/:id', authenticate, requireAdmin, validateProduct, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
