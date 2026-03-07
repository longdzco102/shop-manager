const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/summary', authenticate, ctrl.getSummary);
router.get('/revenue-chart', authenticate, ctrl.getRevenueChart);
router.get('/expense-chart', authenticate, ctrl.getExpenseChart);
router.get('/recent-sales', authenticate, ctrl.getRecentSales);
router.get('/monthly-revenue', authenticate, ctrl.getMonthlyRevenue);
router.get('/profit-chart', authenticate, ctrl.getProfitChart);

module.exports = router;
