const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
