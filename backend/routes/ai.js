const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.post('/chat', authenticate, ctrl.chat);

module.exports = router;
