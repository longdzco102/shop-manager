const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth); // reads token if present

router.get('/', ctrl.getCart);
router.post('/items', ctrl.addToCart);
router.put('/items/:id', ctrl.updateItem);
router.delete('/items/:id', ctrl.removeItem);

module.exports = router;
