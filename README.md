# Shop Manager Web App

Hệ thống quản lý cửa hàng trực tuyến toàn diện, bao gồm cả cổng **Shop Front** dành cho khách hàng mua sắm và **Admin Panel** dành cho nhân viên/quản trị viên quản lý. Application được xây dựng dựa trên kiến trúc MVC với Node.js, Express, và MySQL.

## Tính năng nổi bật

### 1. Dành cho Khách hàng (Shop Front)
- **Cửa hàng hiển thị sản phẩm**: Xem danh sách sản phẩm, tìm kiếm, lọc theo danh mục.
- **Giỏ hàng (Server-side)**: Hỗ trợ giỏ hàng lưu trữ session chung cho cả khách chưa đăng nhập và đồng bộ khi đăng nhập.
- **Khuyến mãi & Mã giảm giá**: Hỗ trợ dán mã giảm giá (%) hoặc theo số tiền (VNĐ) trực tiếp khi thanh toán.
- **Thanh toán & Đăng ký**: Hỗ trợ khách hàng tự do tạo tài khoản, kiểm tra lịch sử mua hàng, và đặt hàng.

### 2. Dành cho Nhân viên (Staff Panel)
- **Bán hàng tại quầy (POS)**: Dành riêng cho nhân viên thao tác thanh toán trực tiếp tại cửa hàng.
- **Chấm công (Attendance)**: Nhân viên tự đăng ký ca làm việc hằng ngày, tự theo dõi số giờ làm và báo cáo lương cá nhân.
- **Bảo mật phân quyền**: Nhân viên chỉ có thể thấy các module phục vụ công việc của họ (Sản phẩm, Bán hàng, Chấm công cá nhân).

### 3. Dành cho Quản trị viên (Admin Panel)
- **Quản lý toàn diện**: Có quyền xem và thay đổi tất cả các dữ liệu bao gồm Danh mục, Sản phẩm, Bán hàng, Nhập hàng, và Chi phí.
- **Quản trị Nhân sự**: 
  - Khởi tạo và quản lý tài khoản nhân viên.
  - Sửa và duyệt ca làm việc (Chấm công, tăng ca, vắng mặt) của toàn bộ nhân viên. Bảng lương tự động cập nhật.
- **Quản trị Khuyến mãi**: Tạo và quản lý chủ động mã ưu đãi (Discount Code) trực tiếp trên dashboard.
- **Báo cáo & Thống kê**: Biểu đồ doanh thu, thu chi lợi nhuận trực quan.

## Kĩ thuật
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, CSS, Vanilla JS
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **Architecture:** MVC (Models, Views, Controllers)

---

## 🚀 Hướng Dẫn Cài Đặt Tại Máy (Local Development)

Dành cho các nhà phát triển muốn đóng góp hoặc nâng cấp Frontend/Backend của dự án này.

### Yêu Cầu Chuẩn Bị
Kiểm tra máy tính của bạn đã cài đặt:
1. **[Node.js](https://nodejs.org/)** (Khuyến khích phiên bản LTS)
2. **MySQL Server** (Bạn có thể dùng XAMPP, MAMP, hoặc cài trực tiếp MySQL lên máy).

### Các Bước Cài Đặt

**1. Tải Mã Nguồn (Clone)**
Mở Terminal/Command Prompt và chạy:
\`\`\`bash
git clone https://github.com/longdzco102/shop-manager.git
cd shop-manager
\`\`\`

**2. Cài Đặt Thư Viện (Dependencies)**
\`\`\`bash
npm install
\`\`\`

**3. Thiết Lập Môi Trường (Environment Variables)**
Tạo một file có tên là \`.env\` tại thư mục gốc của dự án (`/shop-manager/.env`) và điền các thông số cơ bản sau:
\`\`\`env
# Port chạy Server
PORT=3000

# Cấu hình kết nối MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shop_manager

# Chìa khóa bảo mật dành cho Đăng nhập
JWT_SECRET=supersecretkey123_please_change_this_in_production
\`\`\`
*(Lưu ý: Bạn có thể thay đổi DB_USER / DB_PASSWORD nếu cấu hình MySQL của bạn yêu cầu mật khẩu).*

**4. Khởi Tạo Cơ Sở Dữ Liệu (Database)**
Bật phần mềm quản lý Database của bạn lên (ví dụ: phpMyAdmin nếu là XAMPP) và tạo một database (schema) mới **trống** có tên đúng như cấu hình \`.env\` phía trên:
> **Tên CSDL:** `shop_manager`

*💡 Không cần phải tự import bảng nào cả. Hệ thống đã cài sẵn trình khởi tạo tự động, sẽ tự \`CREATE TABLE\` và rải dữ liệu mẫu khi Server chạy lần đầu.*

**5. Khởi Động Server**
Mở Terminal và khởi động Nodejs Server:
\`\`\`bash
node backend/server.js
\`\`\`
Nếu Terminal hiển thị \`✅ Database tables initialized\` và \`🚀 Server running on http://localhost:3000\`, chúc mừng bạn đã cài đặt thành công!

**6. Truy Cập Ứng Dụng Hằng Ngày**
Mặc định ứng dụng sẽ chạy trên máy chủ của bạn qua địa chỉ:
- Cổng khách hàng (Shop Front): **[http://localhost:3000/](http://localhost:3000/)**
- Cổng quản trị Admin/Staff: **[http://localhost:3000/admin/](http://localhost:3000/admin/)**

Khi đăng nhập vào Admin, tài khoản Quản trị mặc định (Nếu database chưa có ai) sẽ tự động được khởi tạo là:
- **Tài khoản:** \`admin\`
- **Mật khẩu:** \`admin123\`

## 🔥 Quy Trình Phát Triển Frontend
1. Các files giao diện hiển thị nằm ở thư mục \`/frontend\`.
2. Bất cứ khi nào bạn chỉnh sửa file HTML, CSS hay tự thiết kế các modules JS nằm trong các thư mục tương ứng, bạn chỉ cần quay lại trình duyệt và nhấn phím **F5**.
3. Bạn **không** cần phải Tắt và Khởi động lại Server thông qua phím (Ctrl+C) trừ phi bạn lập trình trên thư mục \`/backend\`. Toàn bộ giao diện tĩnh được phục vụ live từ Web Server.
