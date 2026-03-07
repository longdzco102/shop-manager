const db = require('../config/db');

// Dashboard summary
async function getSummary(req, res) {
    try {
        const [[revenue]] = await db.query('SELECT COALESCE(SUM(total), 0) as total_revenue FROM sales');
        const [[expenses]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses');
        const [[productCount]] = await db.query('SELECT COUNT(*) as count FROM products');
        const [[saleCount]] = await db.query('SELECT COUNT(*) as count FROM sales');
        const [[todayRevenue]] = await db.query(
            'SELECT COALESCE(SUM(total), 0) as today FROM sales WHERE DATE(created_at) = CURDATE()'
        );

        res.json({
            total_revenue: revenue.total_revenue,
            total_expenses: expenses.total_expenses,
            profit: revenue.total_revenue - expenses.total_expenses,
            product_count: productCount.count,
            sale_count: saleCount.count,
            today_revenue: todayRevenue.today
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Revenue chart data (last 30 days)
async function getRevenueChart(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total) as revenue
            FROM sales
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Expense chart data (by category)
async function getExpenseChart(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT category, SUM(amount) as total
            FROM expenses
            GROUP BY category
            ORDER BY total DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Recent sales
async function getRecentSales(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Monthly revenue report
async function getMonthlyRevenue(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(total) as revenue,
                COUNT(*) as sale_count
            FROM sales
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Profit chart (monthly revenue vs expenses)
async function getProfitChart(req, res) {
    try {
        const [revenue] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as amount
            FROM sales
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        `);
        const [expenses] = await db.query(`
            SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as amount
            FROM expenses
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        `);
        res.json({ revenue, expenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getSummary, getRevenueChart, getExpenseChart, getRecentSales, getMonthlyRevenue, getProfitChart };
