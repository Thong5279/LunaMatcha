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
  try {
    const { date, category, customCategoryName, amount, note } = req.body;

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

    const cost = new Cost({
      date: targetDate,
      category,
      customCategoryName: category === 'other' ? customCategoryName : '',
      amount,
      note: note || '',
    });

    await cost.save();
    res.status(201).json(cost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
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

