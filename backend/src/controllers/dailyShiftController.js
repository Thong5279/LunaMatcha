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
      const orders = await Order.find({
        $or: [
          { orderDate: { $gte: startOfDay, $lte: endOfDay } },
          { orderDate: { $exists: false }, createdAt: { $gte: startOfDay, $lte: endOfDay } }
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
      const orders = await Order.find({
        $or: [
          { orderDate: { $gte: startOfDay, $lte: endOfDay } },
          { orderDate: { $exists: false }, createdAt: { $gte: startOfDay, $lte: endOfDay } }
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

module.exports = {
  getOrCreateShift,
  updateStartAmount,
  getShifts,
};

