const db = require('../config/db');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// 8 model FREE đã test OK lúc 21:15 ngày 12/04/2026
const FREE_MODELS = [
    'google/gemma-3-12b-it:free',
    'google/gemma-3-4b-it:free',
    'google/gemma-3n-e4b-it:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'minimax/minimax-m2.5:free',
    'arcee-ai/trinity-large-preview:free',
    'openai/gpt-oss-120b:free',
];

async function callOpenRouter(apiKey, model, messages) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, max_tokens: 800 })
    });
    const data = await response.json();
    if (response.ok && data.choices && data.choices[0]?.message?.content) {
        return { ok: true, reply: data.choices[0].message.content };
    }
    return { ok: false, error: data.error?.message || 'no content' };
}

const chat = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.json({
            reply: '⚠️ Chatbot chưa kích hoạt. Cần OPENROUTER_API_KEY trong .env',
            setupRequired: true
        });
    }

    // CHỈ lấy thông tin sản phẩm CÔNG KHAI cho khách hàng
    let productData = '';
    try {
        const [products] = await db.query(
            `SELECT p.name, p.price, p.stock, p.category,
                    pd.discount_percentage
             FROM products p
             LEFT JOIN product_discounts pd ON pd.product_id = p.id 
                AND NOW() BETWEEN pd.start_date AND pd.end_date
             WHERE p.stock >= 0
             ORDER BY p.name
             LIMIT 50`
        );
        if (products.length > 0) {
            const productList = products.map(p => {
                const hasDiscount = p.discount_percentage && p.discount_percentage > 0;
                const finalPrice = hasDiscount ? Math.round(p.price * (1 - p.discount_percentage / 100)) : p.price;
                const status = p.stock <= 0 ? 'Hết hàng' : (p.stock <= 5 ? 'Sắp hết' : 'Còn hàng');
                let info = `- ${p.name} | Giá: ${finalPrice.toLocaleString('vi-VN')}đ | ${status}`;
                if (p.category) info += ` | Danh mục: ${p.category}`;
                if (hasDiscount) info += ` | Giảm ${Math.round(p.discount_percentage)}%`;
                return info;
            }).join('\n');
            productData = `\n[DANH SÁCH SẢN PHẨM THỰC TẾ CỦA CỬA HÀNG - CHỈ DÙNG DANH SÁCH NÀY]\n${productList}`;
        } else {
            productData = '\n[CỬA HÀNG HIỆN CHƯA CÓ SẢN PHẨM NÀO]';
        }
    } catch (e) {
        console.error('Product context err:', e.message);
        productData = '\n[LỖI TẢI SẢN PHẨM - KHÔNG ĐƯỢC BỊA TÊN SẢN PHẨM]';
    }

    // Prompt CHỈ cho phép trả lời về sản phẩm – CHẶN thông tin nhạy cảm
    const prompt = `[BẠN LÀ ShopAI - trợ lý mua sắm của cửa hàng MyShop. Trả lời TIẾNG VIỆT, ngắn gọn, thân thiện, dùng emoji.]

[QUY TẮC BẮT BUỘC]
1. Bạn CHỈ ĐƯỢC trả lời về: sản phẩm (tên, giá, tình trạng hàng, khuyến mãi, danh mục), tư vấn mua hàng, gợi ý sản phẩm phù hợp.
2. Bạn KHÔNG ĐƯỢC trả lời về: doanh thu, doanh số, lợi nhuận, chi phí, nhập hàng, lương nhân viên, số liệu kinh doanh, thông tin nội bộ cửa hàng.
3. Nếu khách hỏi về những thông tin nhạy cảm (doanh thu, lợi nhuận, doanh số, chi phí, nhân viên...), hãy từ chối lịch sự: "Xin lỗi, tôi chỉ có thể hỗ trợ bạn về thông tin sản phẩm, giá cả và khuyến mãi thôi ạ! 😊"
4. Bạn có thể chitchat nhẹ nhàng (chào hỏi, cảm ơn) nhưng luôn hướng về sản phẩm.
5. TUYỆT ĐỐI KHÔNG ĐƯỢC bịa ra tên sản phẩm, giá, hoặc khuyến mãi không có trong danh sách bên dưới. Nếu danh sách trống hoặc không có sản phẩm phù hợp, hãy nói "Hiện tại cửa hàng chưa có sản phẩm đó ạ".
6. Khi gợi ý sản phẩm, CHỈ dùng chính xác tên và giá từ danh sách dưới đây - KHÔNG ĐƯỢC tự nghĩ ra sản phẩm mới.
${productData}

[Câu hỏi khách hàng] ${message}`;

    const messages = [{ role: 'user', content: prompt }];

    // Thử lần lượt 8 model cho đến khi có kết quả
    for (const model of FREE_MODELS) {
        const result = await callOpenRouter(apiKey, model, messages);
        if (result.ok) {
            console.log(`✅ AI: ${model}`);
            return res.json({ reply: result.reply });
        }
        console.warn(`❌ ${model}: ${result.error}`);
    }

    return res.json({ reply: '⏳ AI đang quá tải. Thử lại sau 1-2 phút.' });
});

module.exports = { chat };
