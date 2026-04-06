/* ======================================
   ABOUT PAGE (Customer)
   ====================================== */
const CustomerAboutPage = {
    render() {
        const content = document.getElementById('content-area');
        content.innerHTML = `
            <section style="background-color: #1e293b; color: white; padding: 60px 20px; text-align: center;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">🏠 Trang chủ > Về chúng tôi</p>
                    <h1 style="font-size: 36px; margin: 15px 0;">GIỚI THIỆU</h1>
                    <p style="font-size: 16px;">Khám phá hành trình xây dựng nền tảng mua sắm MyShop</p>
                </div>
            </section>

            <section style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="text-align: center; font-size: 28px; color: #2563eb; margin-bottom: 30px; margin-top: 40px;">Câu Chuyện Của Chúng Tôi</h2>
                <div style="background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); max-width: 1000px; margin: 0 auto;">
                    <p style="line-height: 1.8; color: #475569; margin-bottom: 20px; text-align: justify;"><strong>MyShop</strong> không chỉ là một dự án kết thúc môn học thông thường, mà là một chặng đường đầy tâm huyết của <strong>Nhóm 8</strong> – 5 sinh viên mang trong mình tình yêu mãnh liệt với công nghệ, thuộc chuyên ngành <strong>Mạng máy tính và Truyền thông dữ liệu tại Đại học Công nghiệp Hà Nội</strong>.</p>
                    <p style="line-height: 1.8; color: #475569; margin-bottom: 20px; text-align: justify;">Câu chuyện của chúng tôi bắt đầu từ những đêm thức trắng, cấu hình từng thiết bị mạng, thiết kế các hệ thống truyền tải dữ liệu và phân tích các giao thức phức tạp. Chúng tôi nhận ra rằng, đằng sau mỗi cú click chuột mua sắm trên màn hình là cả một hệ thống hạ tầng khổng lồ cần sự ổn định, tốc độ và bảo mật tuyệt đối.</p>
                    <p style="line-height: 1.8; color: #475569; margin-bottom: 20px; text-align: justify;">Từ đó, một câu hỏi lớn được đặt ra: Tại sao chúng ta không tự tay xây dựng một nền tảng thương mại điện tử trọn vẹn – nơi kết hợp hoàn hảo giữa giao diện người dùng thân thiện và một kiến trúc mạng lõi vững chắc?</p>
                    <p style="line-height: 1.8; color: #475569; margin-bottom: 20px; text-align: justify;">Và dự án <strong>Thiết kế website quản lí nhà hàng, cửa hàng tạp hoá vừa và nhỏ</strong> đã ra đời.</p>
                    <p style="line-height: 1.8; color: #475569; margin-bottom: 20px; text-align: justify;">Chúng tôi đã dành hàng trăm giờ đồng hồ để gọt giũa từng dòng code, từ việc tối ưu hóa tốc độ tải trang, đảm bảo an toàn dữ liệu, đến xây dựng một giao diện quản lý mượt mà. Nhóm 8 khao khát tạo ra một sản phẩm thực sự hướng tới con người, quan tâm đến từng trải nghiệm của họ trên hệ thống.</p>
                </div>
            </section>

            <section style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="text-align: center; font-size: 28px; color: #2563eb; margin-bottom: 30px;">Đội Ngũ Phát Triển</h2>
                <p style="text-align: center; display: block; width: 100%; margin-bottom: 30px; color: #475569;">Sản phẩm được tạo nên từ sự hợp tác sáng tạo và nỗ lực không ngừng của 5 thành viên Nhóm 8</p>
                <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-top: 40px; margin-bottom: 40px;">
                    <div style="background: #fff; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 200px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; background-color: #fee2e2;"><span>👩‍💻</span></div>
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 5px;">Vũ Thị Thúy Liên</h3>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">Thành viên Nhóm 8</span>
                    </div>
                    <div style="background: #fff; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 200px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; background-color: #dcfce7;"><span>👩‍💻</span></div>
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 5px;">Phạm Diệu Linh</h3>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">Thành viên Nhóm 8</span>
                    </div>
                    <div style="background: #fff; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 200px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; background-color: #dbeafe;"><span>👨‍💻</span></div>
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 5px;">Dương Hoàng Long</h3>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">Thành viên Nhóm 8</span>
                    </div>
                    <div style="background: #fff; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 200px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; background-color: #fef3c7;"><span>👨‍💻</span></div>
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 5px;">Nguyễn Đương Hải Long</h3>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">Thành viên Nhóm 8</span>
                    </div>
                    <div style="background: #fff; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 200px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; background-color: #f3e8ff;"><span>👨‍💻</span></div>
                        <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 5px;">Trần Hữu Long</h3>
                        <span style="font-size: 13px; color: #64748b; font-weight: 500;">Thành viên Nhóm 8</span>
                    </div>
                </div>
            </section>

            <section style="background-color: #f4f7fa; padding: 50px 20px; display: flex; justify-content: center;">
                <div style="background-color: #eef4f9; padding: 40px 60px; border-radius: 12px; text-align: center; max-width: 800px; width: 100%;">
                    <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 25px;">SẢN PHẨM CỦA CHÚNG TÔI</h2>
                    <ul style="list-style: none; line-height: 2; color: #334155; font-size: 16px; text-align: left; margin: 0 auto; display: inline-block;">
                        <li><span style="margin-right: 15px;">💻</span> <strong>Thiết kế website quản lí nhà hàng, cửa hàng tạp hoá vừa và nhỏ</strong></li>
                        <li><span style="margin-right: 15px;">🎓</span> Ngành: Mạng máy tính và Truyền thông dữ liệu</li>
                        <li><span style="margin-right: 15px;">🏛️</span> Trường Đại học Công nghiệp Hà Nội</li>
                    </ul>
                </div>
            </section>
        `;
    }
};
