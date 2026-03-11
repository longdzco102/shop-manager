const router = require('express').Router();
const ctrl = require('../controllers/shopController');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/products', ctrl.getProducts);
router.get('/products/:id', ctrl.getProductDetail);

// Requires customer login
router.post('/checkout', authenticate, ctrl.checkout);
router.get('/my-orders', authenticate, ctrl.getMyOrders);
router.get('/my-orders/:id', authenticate, ctrl.getOrderDetail);

module.exports = router;
