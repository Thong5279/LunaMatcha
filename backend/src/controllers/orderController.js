const Order = require('../models/Order');
const DailyShift = require('../models/DailyShift');

// Lấy danh sách đơn hàng
const getOrders = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      // Sử dụng orderDate nếu có, fallback về createdAt cho orders cũ
      query.$or = [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ];
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      // Sử dụng orderDate nếu có, fallback về createdAt cho orders cũ
      query.$or = [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const { items, customerPaid, change, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }

    // Tính tổng tiền - đảm bảo tính đúng cả topping
    let totalAmount = 0;
    items.forEach((item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      const toppingTotal = item.toppings && item.toppings.length > 0
        ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
        : 0;
      totalAmount += itemTotal + toppingTotal;
    });

    // Xử lý payment method và tính customerPaid, change
    let finalPaymentMethod = paymentMethod || 'cash';
    let finalCustomerPaid = customerPaid || 0;
    let finalChange = change || 0;

    if (finalPaymentMethod === 'exact_amount') {
      // Khách đưa đủ tiền, không cần thối
      finalCustomerPaid = totalAmount;
      finalChange = 0;
    } else if (finalPaymentMethod === 'bank_transfer') {
      // Chuyển khoản, không có tiền mặt
      finalCustomerPaid = 0;
      finalChange = 0;
    }
    // Nếu là 'cash', giữ nguyên giá trị từ req.body

    // Set orderDate = ngày hôm nay (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const order = new Order({
      items,
      totalAmount,
      customerPaid: finalCustomerPaid,
      change: finalChange,
      paymentMethod: finalPaymentMethod,
      orderDate: today,
    });

    await order.save();

    // Tự động cập nhật DailyShift
    try {
      // Sử dụng orderDate nếu có, fallback về createdAt cho orders cũ
      const orderDate = order.orderDate || new Date(order.createdAt);
      const targetDate = new Date(orderDate);
      targetDate.setHours(0, 0, 0, 0);

      let shift = await DailyShift.findOne({ date: targetDate });

      if (!shift) {
        // Tạo shift mới nếu chưa có
        shift = new DailyShift({
          date: targetDate,
          startAmount: 0,
          cashAmount: 0,
          bankTransferAmount: 0,
          endAmount: 0,
          netAmount: 0,
          orders: [],
        });
      }

      // Tính lại từ tất cả orders trong ngày
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
    } catch (shiftError) {
      console.error('Lỗi khi cập nhật DailyShift:', shiftError);
      // Không throw error để không ảnh hưởng đến việc tạo order
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật đơn hàng
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (items && Array.isArray(items) && items.length > 0) {
      // Tính lại tổng tiền - đảm bảo tính đúng cả topping
      let totalAmount = 0;
      items.forEach((item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const toppingTotal = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        totalAmount += itemTotal + toppingTotal;
      });

      order.items = items;
      order.totalAmount = totalAmount;
    }

    await order.save();

    // Cập nhật DailyShift sau khi cập nhật order
    try {
      const orderDate = order.orderDate || new Date(order.createdAt);
      const targetDate = new Date(orderDate);
      targetDate.setHours(0, 0, 0, 0);

      const shift = await DailyShift.findOne({ date: targetDate });
      if (shift) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

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
        shift.endAmount = cashAmount;
        shift.netAmount = shift.endAmount - shift.startAmount;
        shift.orders = orders.map((o) => o._id);
        await shift.save();
      }
    } catch (shiftError) {
      console.error('Lỗi khi cập nhật DailyShift:', shiftError);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa đơn hàng
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const orderDate = order.orderDate || new Date(order.createdAt);
    const targetDate = new Date(orderDate);
    targetDate.setHours(0, 0, 0, 0);

    await Order.findByIdAndDelete(id);

    // Cập nhật DailyShift sau khi xóa order
    try {
      const shift = await DailyShift.findOne({ date: targetDate });
      if (shift) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

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
        shift.endAmount = cashAmount;
        shift.netAmount = shift.endAmount - shift.startAmount;
        shift.orders = orders.map((o) => o._id);
        await shift.save();
      }
    } catch (shiftError) {
      console.error('Lỗi khi cập nhật DailyShift:', shiftError);
    }

    res.json({ message: 'Đã xóa đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết đơn hàng
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
};

