/* ======================================
   ABOUT PAGE (Customer)
   ====================================== */
const CustomerAboutPage = {
    render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <section class="about-hero">
                <div class="about-hero-content">
                    <p class="breadcrumb">🏠 Trang chủ > Về chúng tôi</p>
                    <h1>GIỚI THIỆU</h1>
                    <p>Khám phá hành trình xây dựng nền tảng mua sắm MyShop</p>
                </div>
            </section>

            <section class="about-section">
                <h2 class="section-title-center">Câu Chuyện Của Chúng Tôi</h2>
                <div class="story-content">
                    <p><strong>MyShop</strong> không chỉ là một dự án kết thúc môn học thông thường, mà là một chặng đường đầy tâm huyết của <strong>Nhóm 8</strong> – 5 sinh viên mang trong mình tình yêu mãnh liệt với công nghệ, thuộc chuyên ngành <strong>Mạng máy tính và Truyền thông dữ liệu tại Đại học Công nghiệp Hà Nội</strong>.</p>
                    
                    <p>Câu chuyện của chúng tôi bắt đầu từ những đêm thức trắng, cấu hình từng thiết bị mạng, thiết kế các hệ thống truyền tải dữ liệu và phân tích các giao thức phức tạp. Chúng tôi nhận ra rằng, đằng sau mỗi cú click chuột mua sắm trên màn hình là cả một hệ thống hạ tầng khổng lồ cần sự ổn định, tốc độ và bảo mật tuyệt đối. Từ đó, một câu hỏi lớn được đặt ra: Tại sao chúng ta không tự tay xây dựng một nền tảng thương mại điện tử trọn vẹn – nơi kết hợp hoàn hảo giữa giao diện người dùng thân thiện và một kiến trúc mạng lõi vững chắc?</p>
                    
                    <p>Và dự án <strong>Thiết kế website quản lí nhà hàng, cửa hàng tạp hoá vừa và nhỏ</strong> đã ra đời.</p>

                    <p>Chúng tôi đã dành hàng trăm giờ đồng hồ để gọt giũa từng dòng code. Từ việc tối ưu hóa tốc độ tải trang, đảm bảo dữ liệu cá nhân của khách hàng được mã hóa an toàn nhất trên đường truyền, cho đến việc thiết kế một trải nghiệm quản lý mượt mà, trực quan. Dù là những người thường ngày có vẻ tĩnh lặng, gắn bó với các hệ thống máy chủ và dòng lệnh, nhưng sâu thẳm bên trong, Nhóm 8 luôn khao khát tạo ra một sản phẩm thực sự hướng tới con người, quan tâm đến từng trải nghiệm nhỏ nhất của người dùng khi họ tương tác với hệ thống.</p>
                    
                    <p>Mỗi thành viên là một mảnh ghép mang chuyên môn và cá tính riêng. Chúng tôi đã tranh luận, đã gặp vô vàn lỗi hệ thống, nhưng chưa từng có ý định bỏ cuộc. Sản phẩm này chính là minh chứng cho tinh thần đoàn kết, nỗ lực không ngừng nghỉ và khát khao biến những kiến thức hàn lâm thành những giá trị thực tiễn phục vụ cộng đồng.</p>
                </div>
            </section>

            <section class="about-section team-section">
                <h2 class="section-title-center">Đội Ngũ Phát Triển</h2>
                
                <p class="team-subtitle" style="text-align: center; display: block; width: 100%; margin-bottom: 30px;">Sản phẩm được tạo nên từ sự hợp tác sáng tạo và nỗ lực không ngừng của 5 thành viên Nhóm 8</p>
                
                <div class="team-grid">
                    <div class="team-card">
                        <div class="avatar-circle color-1"><span>👩‍💻</span></div>
                        <h3 class="team-name">Vũ Thị Thúy Liên</h3>
                        <span class="team-role">Thành viên Nhóm 8</span>
                    </div>
                    <div class="team-card">
                        <div class="avatar-circle color-2"><span>👩‍💻</span></div>
                        <h3 class="team-name">Phạm Diệu Linh</h3>
                        <span class="team-role">Thành viên Nhóm 8</span>
                    </div>
                    <div class="team-card">
                        <div class="avatar-circle color-3"><span>👨‍💻</span></div>
                        <h3 class="team-name">Dương Hoàng Long</h3>
                        <span class="team-role">Thành viên Nhóm 8</span>
                    </div>
                    <div class="team-card">
                        <div class="avatar-circle color-4"><span>👨‍💻</span></div>
                        <h3 class="team-name">Nguyễn Đương Hải Long</h3>
                        <span class="team-role">Thành viên Nhóm 8</span>
                    </div>
                    <div class="team-card">
                        <div class="avatar-circle color-5"><span>👨‍💻</span></div>
                        <h3 class="team-name">Trần Hữu Long</h3>
                        <span class="team-role">Thành viên Nhóm 8</span>
                    </div>
                </div>
            </section>

            <section class="project-banner">
                <div class="project-banner-content">
                    <h2 class="project-banner-title">SẢN PHẨM CỦA CHÚNG TÔI</h2>
                    <ul class="project-details">
                        <li><span class="icon">💻</span> <strong>Thiết kế website quản lí nhà hàng, cửa hàng tạp hoá vừa và nhỏ</strong></li>
                        <li><span class="icon">🎓</span> Ngành: Mạng máy tính và Truyền thông dữ liệu</li>
                        <li><span class="icon">🏛️</span> Trường Đại học Công nghiệp Hà Nội</li>
                    </ul>
                </div>
            </section>

            <footer class="site-footer">
                <div class="footer-container">
                    <div class="footer-col">
                        <h3>THÔNG TIN LIÊN HỆ</h3>
                        <ul>
                            <li><span>✉️</span> Email: nhom8@gmail.com</li>
                            <li><span>📞</span> Hotline: 0123 456 789</li>
                            <li><span>📍</span> Địa chỉ: Đại học Công nghiệp Hà Nội</li>
                            <li><span>👥</span> Nhóm 8 – Mạng máy tính và Truyền thông dữ liệu</li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h3>SẢN PHẨM CỦA NHÓM 8</h3>
                        <p><strong>Thiết kế website quản lí nhà hàng, cửa hàng tạp hoá vừa và nhỏ</strong></p>
                        <p>Ngành: Mạng máy tính và Truyền thông dữ liệu</p>
                        <p>Trường Đại học Công nghiệp Hà Nội</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>© 2026 MyShop. Tất cả các quyền được bảo lưu.<br>Made with ❤️ by Nhóm 8</p>
                </div>
            </footer>
        `;
    }
};
