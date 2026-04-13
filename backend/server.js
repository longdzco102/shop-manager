const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { globalErrorHandler } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes - Public
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer-auth', require('./routes/customerAuth'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/discounts', require('./routes/discounts'));

// API Routes - Authenticated
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/procurements', require('./routes/procurements'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/ai', require('./routes/ai'));

// Admin SPA fallback
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin', 'index.html'));
});

// Unified SPA fallback (all roles)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Global error handler (MUST be last middleware)
app.use(globalErrorHandler);

// Initialize database and start server
const db = require('./config/db');

async function initDB() {
    try {
        const conn = await db.getConnection();
        console.log('✅ MySQL connected successfully');
        conn.release();

        // Create tables if not exist
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL DEFAULT '',
            role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            price DECIMAL(12, 2) NOT NULL DEFAULT 0,
            stock INT NOT NULL DEFAULT 0,
            category VARCHAR(100) DEFAULT '',
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        try {
            const [cols] = await db.query('SHOW COLUMNS FROM products LIKE ?', ['image_url']);
            if (cols.length === 0) {
                await db.query('ALTER TABLE products ADD COLUMN image_url TEXT');
                console.log('✅ Migration: Added image_url to products');
            }
        } catch (err) { console.error('Migration:', err.message); }

        await db.query(`CREATE TABLE IF NOT EXISTS procurements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
            supplier VARCHAR(200) DEFAULT '',
            procurement_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total DECIMAL(12, 2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS sale_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            price DECIMAL(12, 2) NOT NULL DEFAULT 0,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            category VARCHAR(100) DEFAULT '',
            date DATE NOT NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        // Shift Management Tables
        await db.query(`CREATE TABLE IF NOT EXISTS shift_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            pay_multiplier DECIMAL(3,1) DEFAULT 1.0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS shift_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            shift_type_id INT NOT NULL,
            work_date DATE NOT NULL,
            note VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_assignment (user_id, work_date, shift_type_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE CASCADE
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS shift_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            shift_type_id INT NOT NULL,
            work_date DATE NOT NULL,
            note VARCHAR(255) DEFAULT '',
            status ENUM('pending','approved','rejected') DEFAULT 'pending',
            reviewed_by INT DEFAULT NULL,
            reviewed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE CASCADE
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS overtime_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            work_date DATE NOT NULL,
            hours DECIMAL(4,1) NOT NULL DEFAULT 0,
            reason VARCHAR(255) DEFAULT '',
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        // Seed default shift types
        try {
            const [st] = await db.query('SELECT id FROM shift_types LIMIT 1');
            if (st.length === 0) {
                await db.query(`INSERT INTO shift_types (name, start_time, end_time, pay_multiplier) VALUES
                    ('Ca sáng', '06:00:00', '14:00:00', 1.0),
                    ('Ca chiều', '14:00:00', '22:00:00', 1.0),
                    ('Ca đêm', '22:00:00', '06:00:00', 1.5),
                    ('Ca hành chính', '08:00:00', '17:00:00', 1.0)`);
                console.log('✅ Seeded default shift types');
            }
        } catch (err) { /* already seeded */ }

        // === NEW TABLES ===

        await db.query(`CREATE TABLE IF NOT EXISTS discounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            type ENUM('percentage', 'fixed_amount') NOT NULL,
            value DECIMAL(10,2) NOT NULL,
            min_purchase DECIMAL(10,2) DEFAULT 0,
            max_discount DECIMAL(10,2),
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            usage_limit INT,
            used_count INT DEFAULT 0,
            status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS product_discounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            discount_percentage DECIMAL(5,2) NOT NULL,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS cart_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(255),
            user_id INT,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS discount_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            discount_id INT NOT NULL,
            sale_id INT NOT NULL,
            discount_amount DECIMAL(10,2) NOT NULL,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (discount_id) REFERENCES discounts(id),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )`);

        // === MIGRATIONS ===

        // Migration: Add salary fields to users
        try {
            const [cols] = await db.query('SHOW COLUMNS FROM users LIKE ?', ['base_salary']);
            if (cols.length === 0) {
                await db.query('ALTER TABLE users ADD COLUMN base_salary DECIMAL(12,2) DEFAULT 0');
                await db.query('ALTER TABLE users ADD COLUMN hourly_rate DECIMAL(12,2) DEFAULT 25000');
                await db.query('ALTER TABLE users ADD COLUMN overtime_rate DECIMAL(12,2) DEFAULT 37500');
                console.log('✅ Migration: Added salary fields to users');
            }
        } catch (err) { console.error('Salary migration:', err.message); }

        // Migration: Add customer order fields to sales
        try {
            const [cols] = await db.query('SHOW COLUMNS FROM sales LIKE ?', ['status']);
            if (cols.length === 0) {
                await db.query('ALTER TABLE sales ADD COLUMN status ENUM("pending", "completed", "cancelled") DEFAULT "completed"');
                await db.query('ALTER TABLE sales ADD COLUMN customer_name VARCHAR(100) DEFAULT ""');
                await db.query('ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(20) DEFAULT ""');
                console.log('✅ Migration: Added customer fields to sales');
            }
        } catch (err) { console.error('Sales migration:', err.message); }

        // Migration: Expand user roles (add 'customer')
        try {
            await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'staff'");
            console.log('✅ Migration: Expanded user roles');
        } catch (err) { /* already done or not needed */ }

        // Migration: Add discount/shipping/payment fields to sales
        try {
            const [cols] = await db.query('SHOW COLUMNS FROM sales LIKE ?', ['discount_code']);
            if (cols.length === 0) {
                await db.query('ALTER TABLE sales ADD COLUMN discount_code VARCHAR(50) DEFAULT NULL');
                await db.query('ALTER TABLE sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0');
                await db.query('ALTER TABLE sales ADD COLUMN shipping_name VARCHAR(100) DEFAULT ""');
                await db.query('ALTER TABLE sales ADD COLUMN shipping_phone VARCHAR(20) DEFAULT ""');
                await db.query('ALTER TABLE sales ADD COLUMN shipping_address TEXT');
                console.log('✅ Migration: Added discount/shipping fields to sales');
            }
            const [paymentCols] = await db.query('SHOW COLUMNS FROM sales LIKE ?', ['payment_method']);
            if (paymentCols.length === 0) {
                await db.query('ALTER TABLE sales ADD COLUMN payment_method VARCHAR(50) DEFAULT "cod"');
                console.log('✅ Migration: Added payment_method to sales');
            }
        } catch (err) { console.error('Discount migration:', err.message); }

        // Seed admin user if not exists
        const bcrypt = require('bcryptjs');
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (existing.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
                ['admin', hash, 'Administrator', 'admin']
            );
            console.log('✅ Default admin user created (admin / admin123)');
        }

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Make sure MySQL is running and the database "shop_management" exists.');
        process.exit(1);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
