const router = require('express').Router();
const ctrl = require('../controllers/discountController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public
router.get('/active', ctrl.getActive);
router.post('/validate', ctrl.validate);

// Admin
router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.patch('/:id/status', authenticate, requireAdmin, ctrl.updateStatus);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

// Product discounts (admin)
router.get('/products', authenticate, requireAdmin, ctrl.getProductDiscounts);
router.post('/products', authenticate, requireAdmin, ctrl.createProductDiscount);
router.delete('/products/:id', authenticate, requireAdmin, ctrl.removeProductDiscount);

module.exports = router;
