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
      query.createdAt = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
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
    const { items, customerPaid, change } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }

    // Tính tổng tiền
    let totalAmount = 0;
    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      const toppingTotal = item.toppings
        ? item.toppings.reduce((sum, topping) => sum + topping.price, 0) * item.quantity
        : 0;
      totalAmount += itemTotal + toppingTotal;
    });

    const order = new Order({
      items,
      totalAmount,
      customerPaid: customerPaid || 0,
      change: change || 0,
    });

    await order.save();

    // Tự động cập nhật DailyShift
    try {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      let shift = await DailyShift.findOne({ date: orderDate });

      if (!shift) {
        // Tạo shift mới nếu chưa có
        shift = new DailyShift({
          date: orderDate,
          startAmount: 0,
          endAmount: 0,
          netAmount: 0,
          orders: [],
        });
      }

      // Tính lại tổng doanh thu từ tất cả orders trong ngày
      const startOfDay = new Date(orderDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(orderDate);
      endOfDay.setHours(23, 59, 59, 999);

      const orders = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      shift.endAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
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
      // Tính lại tổng tiền
      let totalAmount = 0;
      items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const toppingTotal = item.toppings
          ? item.toppings.reduce((sum, topping) => sum + topping.price, 0) * item.quantity
          : 0;
        totalAmount += itemTotal + toppingTotal;
      });

      order.items = items;
      order.totalAmount = totalAmount;
    }

    await order.save();

    // Cập nhật DailyShift sau khi cập nhật order
    try {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      const shift = await DailyShift.findOne({ date: orderDate });
      if (shift) {
        const startOfDay = new Date(orderDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(orderDate);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await Order.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        shift.endAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
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

    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);

    await Order.findByIdAndDelete(id);

    // Cập nhật DailyShift sau khi xóa order
    try {
      const shift = await DailyShift.findOne({ date: orderDate });
      if (shift) {
        const startOfDay = new Date(orderDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(orderDate);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await Order.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });

        shift.endAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
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

