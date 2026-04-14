const router = require('express').Router();
const ctrl = require('../controllers/saleController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateSale, validateStatus } = require('../validators/saleValidator');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, validateSale, ctrl.create);
router.put('/:id/status', authenticate, validateStatus, ctrl.updateStatus);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
