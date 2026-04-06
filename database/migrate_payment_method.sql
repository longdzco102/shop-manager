-- Migration: Thêm cột payment_method vào bảng sales hiện tại
-- Chạy script này nếu database đã tồn tại

-- Thêm cột payment_method (bỏ qua nếu đã có)
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS payment_method ENUM('cod', 'momo') NOT NULL DEFAULT 'cod';

-- Thêm các cột còn thiếu nếu sales table cũ chưa có
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200) DEFAULT '';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) DEFAULT '';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(100) DEFAULT NULL;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(200) DEFAULT '';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20) DEFAULT '';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS shipping_address TEXT DEFAULT '';

SELECT 'Migration completed successfully!' AS message;
