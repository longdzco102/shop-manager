const db = require('../config/db');

class Dashboard {
    static async getSummary() {
        const [[revenue]] = await db.query('SELECT COALESCE(SUM(total), 0) as total_revenue FROM sales');
        const [[expenses]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses');
        const [[productCount]] = await db.query('SELECT COUNT(*) as count FROM products');
        const [[saleCount]] = await db.query('SELECT COUNT(*) as count FROM sales');
        const [[todayRevenue]] = await db.query(
            'SELECT COALESCE(SUM(total), 0) as today FROM sales WHERE DATE(created_at) = CURDATE()'
        );

        return {
            total_revenue: revenue.total_revenue,
            total_expenses: expenses.total_expenses,
            profit: revenue.total_revenue - expenses.total_expenses,
            product_count: productCount.count,
            sale_count: saleCount.count,
            today_revenue: todayRevenue.today
        };
    }

    static async getRevenueChart() {
        const [rows] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total) as revenue
            FROM sales
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        return rows;
    }

    static async getExpenseChart() {
        const [rows] = await db.query(`
            SELECT category, SUM(amount) as total
            FROM expenses GROUP BY category ORDER BY total DESC
        `);
        return rows;
    }

    static async getRecentSales() {
        const [rows] = await db.query(`
            SELECT s.*, u.username, u.full_name
            FROM sales s JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC LIMIT 10
        `);
        return rows;
    }

    static async getMonthlyRevenue() {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
                   SUM(total) as revenue, COUNT(*) as sale_count
            FROM sales GROUP BY month ORDER BY month DESC LIMIT 12
        `);
        return rows;
    }

    static async getProfitChart() {
        const [revenue] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as amount
            FROM sales GROUP BY month ORDER BY month DESC LIMIT 12
        `);
        const [expenses] = await db.query(`
            SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as amount
            FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12
        `);
        return { revenue, expenses };
    }

    static async getAIContext() {
        const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products');
        const [[{ low_stock }]] = await db.query('SELECT COUNT(*) as low_stock FROM products WHERE stock <= 5');
        const [[{ today_revenue }]] = await db.query('SELECT SUM(total) as today_revenue FROM sales WHERE DATE(created_at) = CURDATE()');
        const [[{ total_procurement }]] = await db.query('SELECT SUM(purchase_price * quantity) as total_procurement FROM procurements');
        const [[{ total_expenses }]] = await db.query('SELECT SUM(amount) as total_expenses FROM expenses');
        return { total_products, low_stock, today_revenue, total_procurement, total_expenses };
    }
}

module.exports = Dashboard;
