const router = require('express').Router();
const ctrl = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

// optionalAuth: chatbot hoạt động cả khi token hết hạn
router.post('/chat', optionalAuth, ctrl.chat);

module.exports = router;
