const DailyShift = require('../models/DailyShift');
const Order = require('../models/Order');

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

    // Tạo ESC/POS commands cho máy in nhiệt
    // ESC/POS là chuẩn phổ biến cho máy in bill
    const escposCommands = Buffer.concat([
      Buffer.from([0x1B, 0x40]), // Reset printer
      Buffer.from([0x1B, 0x61, 0x01]), // Center align
      Buffer.from([0x1D, 0x21, 0x11]), // Double height and width
      Buffer.from('LUNA MATCHA\n', 'utf8'),
      Buffer.from([0x1D, 0x21, 0x00]), // Normal size
      Buffer.from('Tong ket ca lam viec\n', 'utf8'),
      Buffer.from([0x0A]), // Line feed
      Buffer.from([0x1B, 0x61, 0x00]), // Left align
      Buffer.from(`Ngay: ${formatDate(shift.date)}\n`, 'utf8'),
      Buffer.from(`So don hang: ${shift.orders.length}\n`, 'utf8'),
      Buffer.from('\n', 'utf8'),
      Buffer.from(`Tien dau ca: ${formatCurrency(shift.startAmount)} d\n`, 'utf8'),
      Buffer.from(`Doanh thu tien mat: ${formatCurrency(shift.cashAmount)} d\n`, 'utf8'),
      Buffer.from(`Doanh thu chuyen khoan: ${formatCurrency(shift.bankTransferAmount)} d\n`, 'utf8'),
      Buffer.from(`Tong doanh thu: ${formatCurrency(shift.cashAmount + shift.bankTransferAmount)} d\n`, 'utf8'),
      Buffer.from('\n', 'utf8'),
      Buffer.from([0x1B, 0x45, 0x01]), // Bold
      Buffer.from(`Tong tien co: ${formatCurrency(shift.startAmount + shift.endAmount)} d\n`, 'utf8'),
      Buffer.from(`Tien lai: ${formatCurrency(shift.netAmount)} d\n`, 'utf8'),
      Buffer.from([0x1B, 0x45, 0x00]), // Normal
      Buffer.from('\n', 'utf8'),
      Buffer.from(`In luc: ${new Date().toLocaleString('vi-VN')}\n`, 'utf8'),
      Buffer.from([0x1D, 0x56, 0x41, 0x00]), // Cut paper
      Buffer.from([0x0A, 0x0A, 0x0A]), // Feed paper
    ]);

    // Trả về ESC/POS binary data để frontend chia sẻ qua Web Share API
    const fileName = `shift-${formatDate(shift.date).replace(/\//g, '-')}.escpos`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(escposCommands);
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

