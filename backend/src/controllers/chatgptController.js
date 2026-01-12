const axios = require('axios');

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

if (!OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set in environment variables');
}

// Build comprehensive prompt for business analysis
const buildAnalysisPrompt = (data, period, analyzeAll) => {
  const periodText = analyzeAll 
    ? 'toàn bộ dữ liệu lịch sử từ đầu đến giờ' 
    : period === 'monthly' 
      ? `tháng ${data.periodValue}` 
      : period === 'quarterly' 
        ? `quý ${data.periodValue}` 
        : `năm ${data.periodValue}`;

  return `Bạn là một chuyên gia phân tích kinh doanh cho cửa hàng matcha. 
Hãy phân tích dữ liệu sau và đưa ra insights chi tiết, chuyên nghiệp:

**Thời gian phân tích:** ${periodText}

**Dữ liệu kinh doanh:**

1. **Doanh thu:**
   - Doanh thu kỳ này: ${data.revenue?.current?.toLocaleString('vi-VN') || 0} VNĐ
   - Doanh thu kỳ trước: ${data.revenue?.previous?.toLocaleString('vi-VN') || 0} VNĐ
   - Thay đổi: ${data.revenue?.change >= 0 ? '+' : ''}${data.revenue?.changePercent?.toFixed(1) || 0}% (${data.revenue?.change >= 0 ? '+' : ''}${data.revenue?.change?.toLocaleString('vi-VN') || 0} VNĐ)

2. **Chi phí:**
   - Tổng chi phí: ${data.costs?.total?.toLocaleString('vi-VN') || 0} VNĐ
   - Chi phí theo loại:
     ${data.costs?.byCategory ? Object.entries(data.costs.byCategory).map(([cat, amount]) => {
       const labels = { material: 'Nguyên liệu', ice: 'Nước đá', other: 'Khác' };
       return `     - ${labels[cat] || cat}: ${amount?.toLocaleString('vi-VN') || 0} VNĐ`;
     }).join('\n') : '     - Chưa có dữ liệu'}

3. **Lãi/Lỗ:**
   - Lãi/Lỗ: ${data.profit?.amount >= 0 ? '+' : ''}${data.profit?.amount?.toLocaleString('vi-VN') || 0} VNĐ
   - Tỷ lệ lãi: ${data.profit?.margin?.toFixed(1) || 0}%

4. **Sản phẩm:**
   ${data.products?.topProducts && data.products.topProducts.length > 0 
     ? `   Top ${Math.min(5, data.products.topProducts.length)} sản phẩm bán chạy:\n${data.products.topProducts.slice(0, 5).map((p, idx) => 
         `     ${idx + 1}. ${p.productName || p.name}: ${p.quantity || 0} đơn vị, ${(p.revenue || 0).toLocaleString('vi-VN')} VNĐ`
       ).join('\n')}`
     : '   - Chưa có dữ liệu sản phẩm'}

5. **Đơn hàng:**
   - Tổng số đơn: ${data.orders?.total || 0}
   - Giá trị đơn hàng trung bình: ${data.orders?.averageOrderValue?.toLocaleString('vi-VN') || 0} VNĐ

6. **Xu hướng (${data.trends?.revenue?.length || 0} kỳ gần nhất):**
   ${data.trends?.revenue && data.trends.revenue.length > 0 
     ? `   - Doanh thu: ${data.trends.revenue.map(t => t.toLocaleString('vi-VN')).join(' → ')} VNĐ\n` +
       `   - Chi phí: ${data.trends.costs?.map(t => t.toLocaleString('vi-VN')).join(' → ') || 'N/A'} VNĐ\n` +
       `   - Lãi/Lỗ: ${data.trends.profit?.map(t => (t >= 0 ? '+' : '') + t.toLocaleString('vi-VN')).join(' → ') || 'N/A'} VNĐ`
     : '   - Chưa có đủ dữ liệu xu hướng'}

**Yêu cầu phân tích:**

Hãy cung cấp phân tích chi tiết với các phần sau:

1. **TÓM TẮT ĐIỀU HÀNH** (2-3 câu ngắn gọn về tình hình tổng thể)

2. **PHÂN TÍCH DOANH THU**
   - Xu hướng và tốc độ tăng trưởng
   - So sánh với kỳ trước
   - Đánh giá hiệu quả

3. **PHÂN TÍCH CHI PHÍ**
   - Cơ cấu chi phí và tỷ trọng từng loại
   - Hiệu quả sử dụng chi phí
   - Cơ hội tối ưu hóa

4. **PHÂN TÍCH LÃI/LỖ**
   - Đánh giá khả năng sinh lời
   - Tỷ lệ lãi và so sánh với chuẩn ngành
   - Xu hướng lãi/lỗ

5. **ĐÁNH GIÁ SẢN PHẨM**
   - Sản phẩm đóng góp chính
   - Cơ hội phát triển sản phẩm
   - Khuyến nghị về mix sản phẩm

6. **PHÂN TÍCH ĐƠN HÀNG**
   - Mô hình đơn hàng
   - Giá trị đơn hàng trung bình
   - Tần suất và patterns

7. **XU HƯỚNG VÀ DỰ ĐOÁN**
   - Nhận định xu hướng ngắn hạn và dài hạn
   - Dự đoán cho kỳ tiếp theo
   - Các yếu tố ảnh hưởng

8. **KHUYẾN NGHỊ HÀNH ĐỘNG**
   - Quick wins (hành động nhanh, hiệu quả cao)
   - Chiến lược dài hạn
   - Ưu tiên thực hiện

9. **ĐÁNH GIÁ RỦI RO**
   - Rủi ro hiện tại
   - Cảnh báo sớm
   - Biện pháp phòng ngừa

**Format yêu cầu:**
- Sử dụng tiêu đề rõ ràng cho từng phần (## hoặc **)
- Giải thích chi tiết, cụ thể với số liệu
- Đưa ra khuyến nghị hành động cụ thể, có thể thực hiện
- Sử dụng tiếng Việt, chuyên nghiệp, dễ hiểu
- Kết hợp cả phân tích định lượng (số liệu) và định tính (insights)`;
};

// Analyze business data using ChatGPT
const analyzeBusinessData = async (req, res) => {
  try {
    const { data, period, analyzeAll } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Dữ liệu phân tích không được để trống' });
    }

    // Build prompt
    const prompt = buildAnalysisPrompt(data, period, analyzeAll);

    console.log('[ChatGPT] Sending analysis request...');
    console.log('[ChatGPT] Period:', period, 'AnalyzeAll:', analyzeAll);

    // Call OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency, can change to gpt-4o if needed
        messages: [
          {
            role: 'system',
            content: 'Bạn là một chuyên gia phân tích kinh doanh với nhiều năm kinh nghiệm trong ngành F&B, đặc biệt là cửa hàng đồ uống. Bạn có khả năng phân tích dữ liệu sâu sắc, đưa ra insights có giá trị và khuyến nghị hành động cụ thể, thực tế.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000, // Increased for comprehensive analysis
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds timeout
      }
    );

    const analysis = response.data.choices[0]?.message?.content;

    if (!analysis) {
      return res.status(500).json({ message: 'Không nhận được phản hồi từ ChatGPT' });
    }

    console.log('[ChatGPT] Analysis received successfully');
    res.json({ analysis });
  } catch (error) {
    console.error('[ChatGPT] Error:', error.response?.data || error.message);
    
    // Handle specific OpenAI API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ message: 'Lỗi xác thực API. Vui lòng kiểm tra API key.' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ message: 'API đang quá tải. Vui lòng thử lại sau vài phút.' });
    }
    if (error.response?.status === 500) {
      return res.status(500).json({ message: 'Lỗi server từ OpenAI. Vui lòng thử lại sau.' });
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({ message: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.' });
    }

    res.status(500).json({
      message: error.response?.data?.error?.message || error.message || 'Lỗi khi phân tích dữ liệu',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  analyzeBusinessData,
};

