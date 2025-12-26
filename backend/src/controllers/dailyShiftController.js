const DailyShift = require('../models/DailyShift');
const Order = require('../models/Order');
const PDFDocument = require('pdfkit');

// Lấy hoặc tạo ca làm việc cho ngày
const getOrCreateShift = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let shift = await DailyShift.findOne({ date: targetDate });

    if (!shift) {
      // Tính tổng doanh thu từ orders trong ngày
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Query orders theo orderDate hoặc createdAt (cho orders cũ)
      // Chỉ tính orders có status 'completed' (mặc định) hoặc không có status
      const orders = await Order.find({
        $and: [
          {
            $or: [
              { orderDate: { $gte: startOfDay, $lte: endOfDay } },
              { orderDate: { $exists: false }, createdAt: { $gte: startOfDay, $lte: endOfDay } }
            ]
          },
          {
            $or: [
              { status: 'completed' },
              { status: { $exists: false } }
            ]
          }
        ]
      });

      // Tính tiền mặt (chỉ từ cash và exact_amount orders)
      const cashAmount = orders.reduce((sum, o) => {
        if ((o.paymentMethod === 'cash' || o.paymentMethod === 'exact_amount' || !o.paymentMethod) && 
            o.totalAmount && !isNaN(o.totalAmount)) {
          return sum + o.totalAmount;
        }
        return sum;
      }, 0);

      // Tính chuyển khoản
      const bankTransferAmount = orders.reduce((sum, o) => {
        if (o.paymentMethod === 'bank_transfer' && o.totalAmount && !isNaN(o.totalAmount)) {
          return sum + o.totalAmount;
        }
        return sum;
      }, 0);

      shift = new DailyShift({
        date: targetDate,
        startAmount: 0,
        cashAmount,
        bankTransferAmount,
        endAmount: cashAmount, // endAmount = chỉ tiền mặt
        netAmount: cashAmount,
        orders: orders.map((o) => o._id),
      });
      await shift.save();
    } else {
      // LUÔN tính lại từ orders thực tế trong DB để đảm bảo chính xác
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Query orders theo orderDate hoặc createdAt (cho orders cũ)
      // Chỉ tính orders có status 'completed' (mặc định) hoặc không có status
      const orders = await Order.find({
        $and: [
          {
            $or: [
              { orderDate: { $gte: startOfDay, $lte: endOfDay } },
              { orderDate: { $exists: false }, createdAt: { $gte: startOfDay, $lte: endOfDay } }
            ]
          },
          {
            $or: [
              { status: 'completed' },
              { status: { $exists: false } }
            ]
          }
        ]
      });

      // Tính tiền mặt (chỉ từ cash và exact_amount orders)
      const cashAmount = orders.reduce((sum, o) => {
        if ((o.paymentMethod === 'cash' || o.paymentMethod === 'exact_amount' || !o.paymentMethod) && 
            o.totalAmount && !isNaN(o.totalAmount)) {
          return sum + o.totalAmount;
        }
        return sum;
      }, 0);

      // Tính chuyển khoản
      const bankTransferAmount = orders.reduce((sum, o) => {
        if (o.paymentMethod === 'bank_transfer' && o.totalAmount && !isNaN(o.totalAmount)) {
          return sum + o.totalAmount;
        }
        return sum;
      }, 0);

      shift.cashAmount = cashAmount;
      shift.bankTransferAmount = bankTransferAmount;
      shift.endAmount = cashAmount; // endAmount = chỉ tiền mặt
      shift.netAmount = shift.endAmount - shift.startAmount;
      shift.orders = orders.map((o) => o._id);
      await shift.save();
    }

    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật tiền đầu ca
const updateStartAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { startAmount } = req.body;

    const shift = await DailyShift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Không tìm thấy ca làm việc' });
    }

    shift.startAmount = parseFloat(startAmount);
    shift.netAmount = shift.endAmount - shift.startAmount;
    await shift.save();

    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách ca làm việc
const getShifts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const shifts = await DailyShift.find(query).sort({ date: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In bill tổng kết ca làm việc
const printShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await DailyShift.findById(id);

    if (!shift) {
      return res.status(404).json({ message: 'Không tìm thấy ca làm việc' });
    }

    // Helper functions
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    // Tạo PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Tạo buffer để lưu PDF
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      const fileName = `shift-${formatDate(shift.date).replace(/\//g, '-')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

    // Header - LUNA MATCHA (căn giữa, font lớn)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('LUNA MATCHA', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Tiêu đề
    doc.fontSize(16)
       .font('Helvetica')
       .text('Tổng kết ca làm việc', { align: 'center' });
    
    doc.moveDown(1);

    // Thông tin cơ bản
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Ngày: ${formatDate(shift.date)}`, { align: 'left' })
       .text(`Số đơn hàng: ${shift.orders.length}`, { align: 'left' });
    
    doc.moveDown(1);

    // Chi tiết tài chính
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Tiền đầu ca: ${formatCurrency(shift.startAmount)} đ`, { align: 'left' })
       .text(`Doanh thu tiền mặt: ${formatCurrency(shift.cashAmount)} đ`, { align: 'left' })
       .text(`Doanh thu chuyển khoản: ${formatCurrency(shift.bankTransferAmount)} đ`, { align: 'left' })
       .text(`Tổng doanh thu: ${formatCurrency(shift.cashAmount + shift.bankTransferAmount)} đ`, { align: 'left' });
    
    doc.moveDown(1);

    // Tổng kết (bold)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(`Tổng tiền có: ${formatCurrency(shift.startAmount + shift.endAmount)} đ`, { align: 'left' })
       .text(`Tiền lãi: ${formatCurrency(shift.netAmount)} đ`, { align: 'left' });
    
    doc.moveDown(1);

    // Footer
    doc.fontSize(10)
       .font('Helvetica')
       .text(`In lúc: ${new Date().toLocaleString('vi-VN')}`, { align: 'center' });

    // Kết thúc PDF
    doc.end();
  } catch (error) {
    console.error('Error printing shift:', error);
    res.status(500).json({ message: 'Lỗi khi in bill' });
  }
};

module.exports = {
  getOrCreateShift,
  updateStartAmount,
  getShifts,
  printShift,
};

