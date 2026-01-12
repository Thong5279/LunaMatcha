const Order = require('../models/Order');
const Product = require('../models/Product');

// Thống kê theo ngày
const getDailyAnalytics = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày (YYYY-MM-DD)' });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    // Tính tổng doanh thu - đảm bảo tính đúng
    const totalRevenue = orders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        console.warn(`Order ${order._id} có totalAmount không hợp lệ:`, order.totalAmount);
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);
    
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);

    // Top sản phẩm - tính revenue bao gồm cả topping của item đó
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity || 0;
        
        // Tính revenue: giá sản phẩm + topping của item đó
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemToppingRevenue = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        productStats[item.productId].revenue += itemRevenue + itemToppingRevenue;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // So sánh với ngày hôm qua
    const yesterday = new Date(start);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayOrders = await Order.find({
      $or: [
        { orderDate: { $gte: yesterday, $lte: yesterdayEnd } },
        { orderDate: { $exists: false }, createdAt: { $gte: yesterday, $lte: yesterdayEnd } }
      ]
    });

    const previousDayRevenue = yesterdayOrders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);

    const revenueChange = totalRevenue - previousDayRevenue;
    const revenueChangePercent = previousDayRevenue > 0 
      ? ((totalRevenue - previousDayRevenue) / previousDayRevenue) * 100 
      : (totalRevenue > 0 ? 100 : 0);

    // Tính thống kê payment methods
    const cashAmount = orders.reduce((sum, order) => {
      if ((order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && 
          order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const bankTransferAmount = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'bank_transfer' && order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    res.json({
      date,
      totalRevenue,
      totalOrders,
      totalItems,
      topProducts,
      orders,
      previousDayRevenue,
      revenueChange,
      revenueChangePercent,
      cashAmount,
      bankTransferAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thống kê theo tuần
const getWeeklyAnalytics = async (req, res) => {
  try {
    const { week } = req.query; // Format: YYYY-WW
    if (!week) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tuần (YYYY-WW)' });
    }

    const [year, weekNum] = week.split('-W').map(Number);
    const start = new Date(year, 0, 1);
    const daysToAdd = (weekNum - 1) * 7;
    start.setDate(start.getDate() + daysToAdd - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    const totalRevenue = orders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);
    const totalOrders = orders.length;

    // Top sản phẩm
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity || 0;
        
        // Tính revenue: giá sản phẩm + topping của item đó
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemToppingRevenue = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        productStats[item.productId].revenue += itemRevenue + itemToppingRevenue;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // So sánh với tuần trước
    const prevWeekStart = new Date(start);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(end);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    const prevOrders = await Order.find({
      $or: [
        { orderDate: { $gte: prevWeekStart, $lte: prevWeekEnd } },
        { orderDate: { $exists: false }, createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd } }
      ]
    });
    const prevRevenue = prevOrders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);

    // Tính thống kê payment methods
    const cashAmount = orders.reduce((sum, order) => {
      if ((order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && 
          order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const bankTransferAmount = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'bank_transfer' && order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    res.json({
      week,
      startDate: start,
      endDate: end,
      totalRevenue,
      totalOrders,
      topProducts,
      previousWeekRevenue: prevRevenue,
      revenueChange: totalRevenue - prevRevenue,
      revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      cashAmount,
      bankTransferAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function: Tính date range cho quý
const getQuarterDateRange = (quarter, year) => {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
};

// Helper function: Tính date range cho năm
const getYearDateRange = (year) => {
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
};

// Thống kê theo tháng
const getMonthlyAnalytics = async (req, res) => {
  try {
    const { month, period } = req.query; // Format: YYYY-MM, period: 'month' | 'quarter' | 'year'
    
    // Nếu có period parameter, sử dụng endpoint mới
    if (period === 'month' || !period) {
      if (!month) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tháng (YYYY-MM)' });
      }

      const [year, monthNum] = month.split('-').map(Number);
      
      // Validate month format
      if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: 'Định dạng tháng không hợp lệ. Vui lòng sử dụng YYYY-MM' });
      }
      
      const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    const totalRevenue = orders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);
    const totalOrders = orders.length;

    // Top sản phẩm
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity || 0;
        
        // Tính revenue: giá sản phẩm + topping của item đó
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemToppingRevenue = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        productStats[item.productId].revenue += itemRevenue + itemToppingRevenue;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // So sánh với tháng trước
    const prevMonthStart = new Date(year, monthNum - 2, 1);
    const prevMonthEnd = new Date(year, monthNum - 1, 0, 23, 59, 59, 999);

    const prevOrders = await Order.find({
      $or: [
        { orderDate: { $gte: prevMonthStart, $lte: prevMonthEnd } },
        { orderDate: { $exists: false }, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }
      ]
    });
    const prevRevenue = prevOrders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);

    // Tính thống kê payment methods
    const cashAmount = orders.reduce((sum, order) => {
      if ((order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && 
          order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const bankTransferAmount = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'bank_transfer' && order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    // Thống kê theo ngày trong tháng
    const dailyStats = {};
    orders.forEach((order) => {
      const orderDate = order.orderDate || order.createdAt;
      const day = orderDate.getDate();
      if (!dailyStats[day]) {
        dailyStats[day] = { revenue: 0, orders: 0 };
      }
      dailyStats[day].revenue += order.totalAmount || 0;
      dailyStats[day].orders += 1;
    });

    res.json({
      period: 'month',
      periodValue: monthNum,
      year,
      month,
      startDate: start,
      endDate: end,
      totalRevenue,
      totalOrders,
      topProducts,
      previousMonthRevenue: prevRevenue,
      revenueChange: totalRevenue - prevRevenue,
      revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      dailyStats,
      cashAmount,
      bankTransferAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thống kê theo quý
const getQuarterlyAnalytics = async (req, res) => {
  try {
    const { quarter, period, year: yearParam } = req.query; // Format: YYYY-Q hoặc period=quarter&quarter=X&year=Y
    
    let year, quarterNum;
    if (period === 'quarter') {
      // Format mới: period=quarter&quarter=X&year=Y
      quarterNum = parseInt(quarter);
      year = parseInt(yearParam);
      if (!quarterNum || quarterNum < 1 || quarterNum > 4 || !year) {
        return res.status(400).json({ message: 'Vui lòng cung cấp quý (1-4) và năm hợp lệ' });
      }
    } else {
      // Format cũ: YYYY-Q
      if (!quarter) {
        return res.status(400).json({ message: 'Vui lòng cung cấp quý (YYYY-Q)' });
      }
      [year, quarterNum] = quarter.split('-Q').map(Number);
    }

    const { start, end } = getQuarterDateRange(quarterNum, year);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    const totalRevenue = orders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);
    const totalOrders = orders.length;

    // Top sản phẩm
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity || 0;
        
        // Tính revenue: giá sản phẩm + topping của item đó
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemToppingRevenue = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        productStats[item.productId].revenue += itemRevenue + itemToppingRevenue;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // So sánh với quý trước
    const prevQuarterStart = new Date(year, startMonth - 3, 1);
    const prevQuarterEnd = new Date(year, startMonth, 0, 23, 59, 59, 999);

    const prevOrders = await Order.find({
      $or: [
        { orderDate: { $gte: prevQuarterStart, $lte: prevQuarterEnd } },
        { orderDate: { $exists: false }, createdAt: { $gte: prevQuarterStart, $lte: prevQuarterEnd } }
      ]
    });
    const prevRevenue = prevOrders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);

    // Tính thống kê payment methods
    const cashAmount = orders.reduce((sum, order) => {
      if ((order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && 
          order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const bankTransferAmount = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'bank_transfer' && order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    res.json({
      period: 'quarter',
      periodValue: quarterNum,
      year,
      quarter: period === 'quarter' ? `${year}-Q${quarterNum}` : quarter,
      startDate: start,
      endDate: end,
      totalRevenue,
      totalOrders,
      topProducts,
      previousQuarterRevenue: prevRevenue,
      revenueChange: totalRevenue - prevRevenue,
      revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      cashAmount,
      bankTransferAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thống kê theo năm
const getYearlyAnalytics = async (req, res) => {
  try {
    const { year: yearParam, period } = req.query;
    const year = parseInt(yearParam);
    
    if (!year || isNaN(year)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp năm (YYYY) hợp lệ' });
    }

    const { start, end } = getYearDateRange(year);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    const totalRevenue = orders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);
    const totalOrders = orders.length;

    // Top sản phẩm
    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity || 0;
        
        // Tính revenue: giá sản phẩm + topping của item đó
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemToppingRevenue = item.toppings && item.toppings.length > 0
          ? item.toppings.reduce((sum, topping) => sum + ((topping.price || 0) * (item.quantity || 0)), 0)
          : 0;
        productStats[item.productId].revenue += itemRevenue + itemToppingRevenue;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // So sánh với năm trước
    const prevYearStart = new Date(year - 1, 0, 1);
    const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);

    const prevOrders = await Order.find({
      $or: [
        { orderDate: { $gte: prevYearStart, $lte: prevYearEnd } },
        { orderDate: { $exists: false }, createdAt: { $gte: prevYearStart, $lte: prevYearEnd } }
      ]
    });
    const prevRevenue = prevOrders.reduce((sum, order) => {
      if (!order.totalAmount || isNaN(order.totalAmount)) {
        return sum;
      }
      return sum + order.totalAmount;
    }, 0);

    // Tính thống kê payment methods
    const cashAmount = orders.reduce((sum, order) => {
      if ((order.paymentMethod === 'cash' || order.paymentMethod === 'exact_amount' || !order.paymentMethod) && 
          order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const bankTransferAmount = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'bank_transfer' && order.totalAmount && !isNaN(order.totalAmount)) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    // Thống kê theo tháng
    const monthlyStats = {};
    orders.forEach((order) => {
      const orderDate = order.orderDate || order.createdAt;
      const month = orderDate.getMonth() + 1;
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, orders: 0 };
      }
      monthlyStats[month].revenue += order.totalAmount || 0;
      monthlyStats[month].orders += 1;
    });

    res.json({
      period: 'year',
      periodValue: year,
      year,
      startDate: start,
      endDate: end,
      totalRevenue,
      totalOrders,
      topProducts,
      previousYearRevenue: prevRevenue,
      revenueChange: totalRevenue - prevRevenue,
      revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      monthlyStats,
      cashAmount,
      bankTransferAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Giờ cao điểm
const getPeakHours = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Query orders theo orderDate hoặc createdAt (cho orders cũ)
    const orders = await Order.find({
      $or: [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ]
    });

    const hourStats = {};
    for (let i = 0; i < 24; i++) {
      hourStats[i] = { revenue: 0, orders: 0 };
    }

    orders.forEach((order) => {
      const orderDate = order.orderDate || order.createdAt;
      const hour = orderDate.getHours();
      hourStats[hour].revenue += order.totalAmount;
      hourStats[hour].orders += 1;
    });

    res.json({
      date,
      hourStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Top sản phẩm
const getTopProducts = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.$or = [
        { orderDate: { $gte: start, $lte: end } },
        { orderDate: { $exists: false }, createdAt: { $gte: start, $lte: end } }
      ];
    } else if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.$or = [
        { orderDate: { $gte: today, $lt: tomorrow } },
        { orderDate: { $exists: false }, createdAt: { $gte: today, $lt: tomorrow } }
      ];
    } else if (period === 'week') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.$or = [
        { orderDate: { $gte: weekAgo, $lte: today } },
        { orderDate: { $exists: false }, createdAt: { $gte: weekAgo, $lte: today } }
      ];
    } else if (period === 'month') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.$or = [
        { orderDate: { $gte: monthAgo, $lte: today } },
        { orderDate: { $exists: false }, createdAt: { $gte: monthAgo, $lte: today } }
      ];
    }

    const orders = await Order.find(query);

    const productStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.price * item.quantity;
        productStats[item.productId].orders += 1;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    res.json({
      period,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getQuarterlyAnalytics,
  getYearlyAnalytics,
  getPeakHours,
  getTopProducts,
};

