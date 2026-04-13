-- =============================================
-- MIGRATION: Shift Management System
-- Xóa bảng attendance cũ, thêm 4 bảng mới
-- =============================================

-- Xóa bảng attendance cũ
DROP TABLE IF EXISTS attendance;

-- 1. Loại ca (admin cấu hình)
CREATE TABLE IF NOT EXISTS shift_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    pay_multiplier DECIMAL(3,1) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Phân ca (admin sắp xếp)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shift_type_id INT NOT NULL,
    work_date DATE NOT NULL,
    note VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment (user_id, work_date, shift_type_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE CASCADE
);

-- 3. Đề xuất đăng ký ca (nhân viên gửi)
CREATE TABLE IF NOT EXISTS shift_requests (
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
);

-- 4. Giờ làm thêm (admin nhập)
CREATE TABLE IF NOT EXISTS overtime_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    work_date DATE NOT NULL,
    hours DECIMAL(4,1) NOT NULL DEFAULT 0,
    reason VARCHAR(255) DEFAULT '',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Seed ca mặc định
INSERT IGNORE INTO shift_types (name, start_time, end_time, pay_multiplier) VALUES
('Ca sáng', '06:00:00', '14:00:00', 1.0),
('Ca chiều', '14:00:00', '22:00:00', 1.0),
('Ca đêm', '22:00:00', '06:00:00', 1.5),
('Ca hành chính', '08:00:00', '17:00:00', 1.0);
