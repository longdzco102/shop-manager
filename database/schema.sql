-- Shop Management System Database Schema
CREATE DATABASE IF NOT EXISTS shop_management;
USE shop_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL DEFAULT '',
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng nhập hàng (Procurements)
CREATE TABLE IF NOT EXISTS procurements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  supplier VARCHAR(200) DEFAULT '',
  procurement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    customer_name VARCHAR(200) DEFAULT '',
    customer_phone VARCHAR(20) DEFAULT '',
    discount_code VARCHAR(100) DEFAULT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_name VARCHAR(200) DEFAULT '',
    shipping_phone VARCHAR(20) DEFAULT '',
    shipping_address TEXT DEFAULT '',
    payment_method ENUM('cod', 'momo') NOT NULL DEFAULT 'cod',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT '',
    date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Seed admin user (password: admin123)
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2a$10$8KzQz1N1XJZ5yK0r5r5r5uYz1N1XJZ5yK0r5r5r5uYz1N1XJZ5yK', 'Administrator', 'admin');
