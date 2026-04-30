# 🛍️ MyShop - Hệ thống Quản lý Cửa hàng

Ứng dụng quản lý cửa hàng đầy đủ tính năng, gồm **Trang mua sắm** cho khách hàng và **Trang quản trị** cho nhân viên/admin. Xây dựng bằng Node.js + Express + MySQL.

---

## ✨ Tính năng

### Khách hàng
- Xem và tìm kiếm sản phẩm theo danh mục
- Giỏ hàng + Thanh toán (hỗ trợ mã giảm giá)
- Đăng ký tài khoản, xem lịch sử đơn hàng
- Chatbot AI trợ lý mua sắm (tư vấn sản phẩm, giá cả)

### Nhân viên (Staff)
- Bán hàng tại quầy (POS)
- Đăng ký ca làm việc, xem lương cá nhân

### Quản trị viên (Admin)
- Dashboard tổng quan doanh thu
- Quản lý: Sản phẩm, Bán hàng, Nhập hàng, Chi phí
- Quản lý ca làm việc: phân ca, duyệt yêu cầu, tăng ca, bảng lương
- Quản lý nhân viên (tạo tài khoản, cấu hình lương)
- Quản lý khuyến mãi (mã giảm giá + giảm giá sản phẩm)
- Báo cáo & Biểu đồ thống kê
- Xuất Excel

---

## 🛠️ Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js, Express.js |
| Database | MySQL (hỗ trợ TiDB Cloud) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Xác thực | JWT + bcrypt |
| AI Chatbot | OpenRouter API (nhiều model miễn phí) |
| Biểu đồ | Chart.js |
| Xuất Excel | SheetJS |

---

## 🚀 Cài đặt

### Yêu cầu
- **[Node.js](https://nodejs.org/)** (phiên bản LTS)
- **MySQL Server** (XAMPP, hoặc dùng cloud như TiDB)

### Bước 1 — Tải mã nguồn

```bash
git clone https://github.com/longdzco102/shop-manager.git
cd shop-manager
```

### Bước 2 — Cài thư viện

```bash
npm install
```

### Bước 3 — Tạo file `.env`

Tạo file `.env` ở thư mục gốc (`shop-manager/.env`), điền thông tin database:

**Nếu dùng MySQL tại máy (XAMPP):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shop_manager
DB_PORT=3306

JWT_SECRET=doi_thanh_chuoi_bi_mat_cua_ban
```

**Nếu dùng TiDB Cloud:**
```env
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_USER=xxxxx.root
DB_PASSWORD=mat_khau_cua_ban
DB_NAME=ten_database
DB_PORT=4000
DB_SSL=true

JWT_SECRET=doi_thanh_chuoi_bi_mat_cua_ban
```

**Thêm AI Chatbot (tuỳ chọn):**
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```
> Lấy API key miễn phí tại [openrouter.ai](https://openrouter.ai/). Không có key thì chatbot sẽ tắt, app vẫn chạy bình thường.

### Bước 4 — Tạo database

- **MySQL tại máy**: Mở phpMyAdmin → tạo database mới tên `shop_manager`
- **TiDB Cloud**: Database đã có sẵn trên cloud

> 💡 **Không cần import bảng gì.** Server sẽ tự tạo tất cả bảng và dữ liệu mẫu khi chạy lần đầu.

### Bước 5 — Chạy server

```bash
npm start
```

Khi thấy dòng này là thành công:
```
✅ Database tables initialized
🚀 Server running on http://localhost:3000
```

### Bước 6 — Mở trình duyệt

| Trang | Địa chỉ |
|---|---|
| Cửa hàng (Khách) | [http://localhost:3000](http://localhost:3000) |
| Quản trị (Admin/Staff) | [http://localhost:3000/admin](http://localhost:3000/admin) |

**Tài khoản admin mặc định:**
- Tên đăng nhập: `admin`
- Mật khẩu: `admin123`

---

## 📁 Cấu trúc dự án

```
shop-manager/
├── backend/
│   ├── config/         # Cấu hình database
│   ├── controllers/    # Xử lý logic (14 controller)
│   ├── middleware/      # Xác thực JWT
│   ├── models/          # Truy vấn database (11 model)
│   ├── routes/          # Định tuyến API (14 route)
│   ├── utils/           # Xử lý lỗi, format response
│   ├── validators/      # Kiểm tra dữ liệu đầu vào
│   └── server.js        # Khởi tạo server + tự tạo bảng DB
├── frontend/
│   ├── index.html       # Trang chính (khách + admin/staff)
│   ├── admin/
│   │   └── index.html   # Trang quản trị riêng
│   ├── css/
│   │   ├── styles.css       # CSS admin/staff
│   │   └── wdacn-style.css  # CSS trang khách hàng
│   └── js/
│       ├── app.js           # Logic chung (router, auth, sidebar)
│       └── pages/           # Module từng trang (14 file)
├── database/            # File SQL tham khảo
├── .env                 # Biến môi trường (không push lên git)
└── package.json
```

---

## 💻 Phát triển

- Sửa file trong `frontend/` → **F5 trình duyệt** là thấy thay đổi ngay
- Sửa file trong `backend/` → **phải khởi động lại server** (`Ctrl+C` rồi `npm start`)
- Frontend không cần build, server phục vụ trực tiếp file tĩnh

---

## 📝 Ghi chú

- Hệ thống tự động tạo bảng và migration khi khởi động, không cần chạy SQL thủ công
- Tài khoản khách hàng (role `customer`) được tách riêng khỏi danh sách nhân viên
- Ca làm việc mặc định: Ca sáng (6h-14h), Ca chiều (14h-22h), Ca đêm (22h-6h), Ca hành chính (8h-17h)
