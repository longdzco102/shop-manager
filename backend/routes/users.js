const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateUpdate } = require('../validators/userValidator');

router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.put('/:id', authenticate, requireAdmin, validateUpdate, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
