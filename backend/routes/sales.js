const router = require('express').Router();
const ctrl = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, ctrl.create);

module.exports = router;
