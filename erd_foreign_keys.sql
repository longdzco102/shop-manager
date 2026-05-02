-- =============================================
-- BỔ SUNG FOREIGN KEY CHO ERD (MySQL Workbench)
-- Chạy file này trên MySQL local (không phải TiDB)
-- để Reverse Engineer hiển thị đầy đủ quan hệ
-- =============================================

-- sales → users
ALTER TABLE sales ADD CONSTRAINT fk_sales_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- sale_items → sales
ALTER TABLE sale_items ADD CONSTRAINT fk_saleitems_sale
  FOREIGN KEY (sale_id) REFERENCES sales(id);

-- sale_items → products
ALTER TABLE sale_items ADD CONSTRAINT fk_saleitems_product
  FOREIGN KEY (product_id) REFERENCES products(id);

-- procurements → products
-- (đã có sẵn trong CREATE TABLE)

-- expenses → users
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user
  FOREIGN KEY (created_by) REFERENCES users(id);

-- cart_items → products
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_product
  FOREIGN KEY (product_id) REFERENCES products(id);

-- cart_items → users
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- product_discounts → products
ALTER TABLE product_discounts ADD CONSTRAINT fk_proddiscount_product
  FOREIGN KEY (product_id) REFERENCES products(id);

-- discount_usage → discounts
ALTER TABLE discount_usage ADD CONSTRAINT fk_discusage_discount
  FOREIGN KEY (discount_id) REFERENCES discounts(id);

-- discount_usage → sales
ALTER TABLE discount_usage ADD CONSTRAINT fk_discusage_sale
  FOREIGN KEY (sale_id) REFERENCES sales(id);

-- shift_assignments → users
ALTER TABLE shift_assignments ADD CONSTRAINT fk_shiftassign_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- shift_assignments → shift_types
ALTER TABLE shift_assignments ADD CONSTRAINT fk_shiftassign_type
  FOREIGN KEY (shift_type_id) REFERENCES shift_types(id);

-- shift_requests → users
ALTER TABLE shift_requests ADD CONSTRAINT fk_shiftreq_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- shift_requests → shift_types
ALTER TABLE shift_requests ADD CONSTRAINT fk_shiftreq_type
  FOREIGN KEY (shift_type_id) REFERENCES shift_types(id);

-- shift_requests → users (reviewed_by)
ALTER TABLE shift_requests ADD CONSTRAINT fk_shiftreq_reviewer
  FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- overtime_records → users
ALTER TABLE overtime_records ADD CONSTRAINT fk_overtime_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- overtime_records → users (created_by)
ALTER TABLE overtime_records ADD CONSTRAINT fk_overtime_creator
  FOREIGN KEY (created_by) REFERENCES users(id);
