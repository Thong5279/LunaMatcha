const Cost = require('../models/Cost');

// Lấy danh sách chi phí
const getCosts = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = {};

    // Filter theo date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filter theo category
    if (category && ['material', 'ice', 'other'].includes(category)) {
      query.category = category;
    }

    const costs = await Cost.find(query).sort({ date: -1, createdAt: -1 });
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết chi phí
const getCostById = async (req, res) => {
  try {
    const { id } = req.params;
    const cost = await Cost.findById(id);

    if (!cost) {
      return res.status(404).json({ message: 'Không tìm thấy chi phí' });
    }

    res.json(cost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo chi phí mới
const createCost = async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:53',message:'createCost entry',data:{requestBody:req.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    console.log('POST /api/costs - Request body:', req.body);
    const { date, category, customCategoryName, amount, note } = req.body;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:57',message:'after destructuring request body',data:{date,category,customCategoryName,amount,note},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Validation
    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
    }
    if (!category || !['material', 'ice', 'other'].includes(category)) {
      return res.status(400).json({ message: 'Loại chi phí không hợp lệ' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }
    if (category === 'other') {
      if (!note || note.trim() === '') {
        return res.status(400).json({ message: 'Ghi chú là bắt buộc khi chọn loại "Khác"' });
      }
      if (!customCategoryName || customCategoryName.trim() === '') {
        return res.status(400).json({ message: 'Tên loại chi phí là bắt buộc khi chọn loại "Khác"' });
      }
    }

    // Parse date từ frontend (YYYY-MM-DD) và tạo Date object đúng timezone Hồ Chí Minh (UTC+7)
    let targetDate;
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:87',message:'before creating Cost object',data:{targetDate:targetDate?.toISOString(),category,customCategoryName:category==='other'?(customCategoryName||'').trim():'',amount:parseFloat(amount),note:(note||'').trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const cost = new Cost({
      date: targetDate,
      category,
      customCategoryName: category === 'other' ? (customCategoryName || '').trim() : '',
      amount: parseFloat(amount),
      note: (note || '').trim(),
    });

    console.log('Creating cost with data:', {
      date: targetDate,
      category,
      customCategoryName: cost.customCategoryName,
      amount: cost.amount,
      note: cost.note,
    });

    // Validate date before creating
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Ngày không hợp lệ' });
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:108',message:'before cost.save()',data:{costCategory:cost.category,costNote:cost.note,costCustomName:cost.customCategoryName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    await cost.save();
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:110',message:'after cost.save() success',data:{costId:cost._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('Cost created successfully:', cost._id);
    res.status(201).json(cost);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7e442ffd-fe7e-4fd2-8266-a51940c08674',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'costController.js:111',message:'catch block entry',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,500),errorType:typeof error,isNextError:error?.message?.includes('next is not a function')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.error('Error creating cost:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Lỗi validation', 
        errors: errors.length > 0 ? errors : [error.message]
      });
    }
    
    // Handle pre-validate hook errors
    if (error.message && (
      error.message.includes('Ghi chú là bắt buộc') ||
      error.message.includes('Tên loại chi phí là bắt buộc')
    )) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    // Handle CastError (invalid data type)
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ: ' + error.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Chi phí đã tồn tại' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi tạo chi phí',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Cập nhật chi phí
const updateCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, customCategoryName, amount, note } = req.body;

    const cost = await Cost.findById(id);
    if (!cost) {
      return res.status(404).json({ message: 'Không tìm thấy chi phí' });
    }

    // Validation
    if (category && !['material', 'ice', 'other'].includes(category)) {
      return res.status(400).json({ message: 'Loại chi phí không hợp lệ' });
    }
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }
    if (category === 'other' || (cost.category === 'other' && category === undefined)) {
      const finalCategory = category || cost.category;
      if (finalCategory === 'other') {
        const finalNote = note !== undefined ? note : cost.note;
        const finalCustomName = customCategoryName !== undefined ? customCategoryName : cost.customCategoryName;
        if (!finalNote || finalNote.trim() === '') {
          return res.status(400).json({ message: 'Ghi chú là bắt buộc khi chọn loại "Khác"' });
        }
        if (!finalCustomName || finalCustomName.trim() === '') {
          return res.status(400).json({ message: 'Tên loại chi phí là bắt buộc khi chọn loại "Khác"' });
        }
      }
    }

    // Update fields
    if (date) {
      let targetDate;
      if (typeof date === 'string') {
        const [year, month, day] = date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      } else {
        targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
      }
      cost.date = targetDate;
    }
    if (category !== undefined) {
      cost.category = category;
      if (category === 'other') {
        cost.customCategoryName = customCategoryName || '';
        cost.note = note || '';
      } else {
        cost.customCategoryName = '';
        cost.note = note !== undefined ? note : cost.note;
      }
    } else {
      if (customCategoryName !== undefined) cost.customCategoryName = customCategoryName;
      if (note !== undefined) cost.note = note;
    }
    if (amount !== undefined) cost.amount = amount;

    await cost.save();
    res.json(cost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Xóa chi phí
const deleteCost = async (req, res) => {
  try {
    const { id } = req.params;
    const cost = await Cost.findById(id);

    if (!cost) {
      return res.status(404).json({ message: 'Không tìm thấy chi phí' });
    }

    await Cost.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa chi phí thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tổng hợp chi phí theo tháng
const getCostSummary = async (req, res) => {
  try {
    const { month, year } = req.params;

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Tháng không hợp lệ' });
    }

    // Tính start và end date của tháng (timezone Hồ Chí Minh UTC+7)
    const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const costs = await Cost.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Tính tổng theo từng category
    const summary = {
      month: monthNum,
      year: yearNum,
      total: 0,
      byCategory: {
        material: 0,
        ice: 0,
        other: 0,
      },
    };

    costs.forEach((cost) => {
      summary.total += cost.amount;
      if (summary.byCategory[cost.category] !== undefined) {
        summary.byCategory[cost.category] += cost.amount;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCosts,
  getCostById,
  createCost,
  updateCost,
  deleteCost,
  getCostSummary,
};

