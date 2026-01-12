const axios = require('axios');
const AnalysisHistory = require('../models/AnalysisHistory');

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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:118',message:'analyzeBusinessData entry',data:{period:req.body?.period,analyzeAll:req.body?.analyzeAll,hasData:!!req.body?.data,apiKeyExists:!!OPENAI_API_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { data, period, analyzeAll } = req.body;

    if (!OPENAI_API_KEY) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:125',message:'API key missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return res.status(500).json({ message: 'OpenAI API key chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    }

    if (!data) {
      return res.status(400).json({ message: 'Dữ liệu phân tích không được để trống' });
    }

    // Build prompt
    const prompt = buildAnalysisPrompt(data, period, analyzeAll);

    console.log('[ChatGPT] Sending analysis request...');
    console.log('[ChatGPT] Period:', period, 'AnalyzeAll:', analyzeAll);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:143',message:'Before OpenAI API call',data:{period,analyzeAll,promptLength:prompt.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Retry logic with exponential backoff for rate limiting
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;
    let response = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Call OpenAI API
        response = await axios.post(
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
        
        // Success - break out of retry loop
        break;
      } catch (error) {
        lastError = error;
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:185',message:'OpenAI API call failed',data:{retryCount,status:error.response?.status,errorType:error.response?.data?.error?.type,isRateLimit:error.response?.status===429},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Only retry on rate limit (429) errors
        if (error.response?.status === 429 && retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff: 2^retryCount seconds (2s, 4s, 8s)
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[ChatGPT] Rate limited, retrying in ${delay/1000}s (attempt ${retryCount}/${maxRetries})...`);
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:195',message:'Retrying with backoff',data:{retryCount,delay},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // Not a retryable error or max retries reached, throw error
          throw error;
        }
      }
    }
    
    // If we get here without response, throw last error
    if (!response) {
      throw lastError || new Error('Failed to call OpenAI API');
    }

    const analysis = response.data.choices[0]?.message?.content;

    if (!analysis) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:161',message:'No analysis in response',data:{responseKeys:Object.keys(response.data||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return res.status(500).json({ message: 'Không nhận được phản hồi từ ChatGPT' });
    }

    console.log('[ChatGPT] Analysis received successfully');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:166',message:'Analysis success',data:{analysisLength:analysis.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Auto-save analysis to history
    try {
      const { period, analyzeAll, data } = req.body;
      let periodValue = null;
      
      if (!analyzeAll && data?.periodValue) {
        periodValue = data.periodValue;
      }
      
      // Extract metadata from data if available
      const metadata = data ? {
        revenue: data.revenue?.current || 0,
        costs: data.costs?.total || 0,
        profit: data.profit?.amount || 0,
        profitMargin: data.profit?.margin || 0,
        totalOrders: data.orders?.total || 0,
        averageOrderValue: data.orders?.averageOrderValue || 0,
      } : {};
      
      await AnalysisHistory.create({
        analysis,
        period: period || 'all',
        periodValue,
        analyzeAll: analyzeAll || false,
        metadata,
      });
      
      console.log('[ChatGPT] Analysis saved to history');
    } catch (saveError) {
      console.error('[ChatGPT] Error saving analysis to history:', saveError);
      // Don't fail the request if save fails, just log the error
    }
    
    res.json({ analysis });
  } catch (error) {
    console.error('[ChatGPT] Error:', error.response?.data || error.message);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:170',message:'Error caught',data:{status:error.response?.status,errorType:error.response?.data?.error?.type,errorCode:error.response?.data?.error?.code,errorMessage:error.response?.data?.error?.message,hasQuota:error.response?.data?.error?.type==='insufficient_quota'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Handle specific OpenAI API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ message: 'Lỗi xác thực API. Vui lòng kiểm tra API key.' });
    }
    if (error.response?.status === 429) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:176',message:'Rate limit 429',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return res.status(429).json({ message: 'API đang quá tải. Vui lòng thử lại sau vài phút.' });
    }
    if (error.response?.data?.error?.type === 'insufficient_quota') {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatgptController.js:180',message:'Insufficient quota error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return res.status(402).json({ message: 'API key đã hết quota. Vui lòng kiểm tra tài khoản OpenAI và nạp thêm credit.' });
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

