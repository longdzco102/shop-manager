const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/register', authenticate, requireAdmin, ctrl.register);
router.get('/profile', authenticate, ctrl.getProfile);

module.exports = router;
