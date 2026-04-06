const { GoogleGenerativeAI } = require('@google/generative-ai');
const Dashboard = require('../models/Dashboard');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const chat = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new AppError('Chưa cấu hình GEMINI_API_KEY trong tệp .env', 503);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Get shop context from Dashboard model
    const ctx = await Dashboard.getAIContext();

    const systemPrompt = `
    Bạn là trợ lý AI thông minh cho phần mềm Quản lý Cửa Hàng (Shop Manager).
    Bạn đang trò chuyện với một nhân viên hoặc chủ cửa hàng.
    Thông tin hiện tại của cửa hàng:
    - Tổng số sản phẩm đang có: ${ctx.total_products}
    - Số sản phẩm sắp hết hàng (tồn kho <= 5): ${ctx.low_stock}
    - Doanh thu hôm nay: ${ctx.today_revenue ? Number(ctx.today_revenue).toLocaleString('vi-VN') : '0'} VNĐ
    - Tổng vốn đã nhập hàng: ${ctx.total_procurement ? Number(ctx.total_procurement).toLocaleString('vi-VN') : '0'} VNĐ
    - Tổng các khoản chi phí phát sinh: ${ctx.total_expenses ? Number(ctx.total_expenses).toLocaleString('vi-VN') : '0'} VNĐ
    
    Danh sách sản phẩm nổi bật hiện tại (tên, tồn kho, giá):
    ${ctx.product_list}
    
    Hãy trả lời các câu hỏi của người dùng một cách ngắn gọn, chuyên nghiệp và thân thiện. Bạn có quyền tìm kiếm thông tin hàng hóa trong danh sách trên để trả lời.
    Nhiệm vụ của bạn là giúp họ thao tác nhanh, hiểu dữ liệu hoặc tư vấn cách quản lý shop tốt hơn. Ngoài ra, bạn cũng có thể tư vấn, chitchat về các vấn đề ngoài luồng, thị trường, giá cả chung bên ngoài nếu người dùng yêu cầu, không được quá cứng nhắc.
    `;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nNgười dùng: " + message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    });

    res.json({ reply: result.response.text() });
});

module.exports = { chat };
