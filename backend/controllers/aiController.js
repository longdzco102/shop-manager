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

// Fallback: trả lời dựa trên từ khóa khi không có API hoặc AI lỗi
function generateFallbackReply(userMessage, productsTxt) {
    const msg = userMessage.toLowerCase();

    if (msg.includes('doanh thu') || msg.includes('lợi nhuận') || msg.includes('chi phí') || msg.includes('lương') || msg.includes('nhân viên')) {
        return 'Xin lỗi, tôi chỉ có thể hỗ trợ bạn về thông tin sản phẩm, giá cả và khuyến mãi thôi ạ! 😊';
    }
    if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi ')) {
        return 'Chào bạn! 👋 Mình là trợ lý AI của MyShop. Bạn muốn tìm sản phẩm gì hôm nay? 😊';
    }
    if (msg.includes('giảm giá') || msg.includes('khuyến mãi') || msg.includes('sale')) {
        return `Dạ đây là một số sản phẩm bên mình ạ:\n${productsTxt}\n\nBạn muốn tìm hiểu thêm sản phẩm nào ạ? 🛍️`;
    }
    if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('sản phẩm')) {
        return `Bạn tham khảo giá các sản phẩm bên mình nhé:\n${productsTxt}\n\nCần tư vấn thêm cứ nhắn mình ạ! 😊`;
    }
    if (msg.includes('cảm ơn') || msg.includes('thank')) {
        return 'Không có gì ạ! Chúc bạn mua sắm vui vẻ! 🎉';
    }

    return `Mình có thể giúp bạn tìm sản phẩm phù hợp! Hiện bên mình đang có:\n${productsTxt}\n\nBạn quan tâm sản phẩm nào ạ? 😊`;
}

// Lấy danh sách SP ngắn gọn cho fallback
async function getProductSummary() {
    try {
        const [products] = await db.query(
            `SELECT p.name, p.price, pd.discount_percentage
             FROM products p
             LEFT JOIN product_discounts pd ON pd.product_id = p.id
                AND NOW() BETWEEN pd.start_date AND pd.end_date
             WHERE p.stock > 0 ORDER BY p.name LIMIT 5`
        );
        if (products.length === 0) return 'Cửa hàng đang cập nhật sản phẩm.';
        return products.map(p => {
            const disc = p.discount_percentage && p.discount_percentage > 0;
            const price = disc ? Math.round(p.price * (1 - p.discount_percentage / 100)) : p.price;
            return `- ${p.name}: ${price.toLocaleString('vi-VN')}đ` + (disc ? ` (giảm ${Math.round(p.discount_percentage)}%)` : '');
        }).join('\n');
    } catch {
        return 'Đang cập nhật sản phẩm.';
    }
}

const chat = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Không có API key → dùng fallback mock
    if (!apiKey) {
        console.log('🤖 Mock Chatbot (thiếu API key)');
        const summary = await getProductSummary();
        return res.json({ reply: generateFallbackReply(message, summary) });
    }

    // Có API key → gọi AI thật
    let productData = '';
    try {
        const [products] = await db.query(
            `SELECT p.name, p.price, p.stock, p.category, pd.discount_percentage
             FROM products p
             LEFT JOIN product_discounts pd ON pd.product_id = p.id
                AND NOW() BETWEEN pd.start_date AND pd.end_date
             WHERE p.stock >= 0 ORDER BY p.name LIMIT 50`
        );
        if (products.length > 0) {
            const list = products.map(p => {
                const disc = p.discount_percentage && p.discount_percentage > 0;
                const price = disc ? Math.round(p.price * (1 - p.discount_percentage / 100)) : p.price;
                const status = p.stock <= 0 ? 'Hết hàng' : (p.stock <= 5 ? 'Sắp hết' : 'Còn hàng');
                let info = `- ${p.name} | Giá: ${price.toLocaleString('vi-VN')}đ | ${status}`;
                if (p.category) info += ` | Danh mục: ${p.category}`;
                if (disc) info += ` | Giảm ${Math.round(p.discount_percentage)}%`;
                return info;
            }).join('\n');
            productData = `\n[DANH SÁCH SẢN PHẨM]\n${list}`;
        } else {
            productData = '\n[CỬA HÀNG CHƯA CÓ SẢN PHẨM]';
        }
    } catch (e) {
        productData = '\n[LỖI TẢI SẢN PHẨM]';
    }

    const prompt = `[BẠN LÀ ShopAI - trợ lý mua sắm của cửa hàng MyShop. Trả lời TIẾNG VIỆT, ngắn gọn, thân thiện, dùng emoji.]

[QUY TẮC BẮT BUỘC]
1. CHỈ trả lời về: sản phẩm, giá, tình trạng hàng, khuyến mãi, tư vấn mua hàng.
2. KHÔNG trả lời về: doanh thu, lợi nhuận, chi phí, lương, thông tin nội bộ.
3. Nếu hỏi thông tin nhạy cảm → từ chối: "Xin lỗi, tôi chỉ hỗ trợ về sản phẩm và khuyến mãi thôi ạ! 😊"
4. KHÔNG bịa sản phẩm. CHỈ dùng danh sách dưới đây.
${productData}

[Câu hỏi] ${message}`;

    const messages = [{ role: 'user', content: prompt }];

    for (const model of FREE_MODELS) {
        const result = await callOpenRouter(apiKey, model, messages);
        if (result.ok) {
            console.log(`✅ AI: ${model}`);
            return res.json({ reply: result.reply });
        }
        console.warn(`❌ ${model}: ${result.error}`);
    }

    // Tất cả model lỗi → fallback mock
    console.log('🤖 Mock Chatbot (tất cả AI lỗi)');
    const summary = await getProductSummary();
    return res.json({ reply: generateFallbackReply(message, summary) });
});

module.exports = { chat };
