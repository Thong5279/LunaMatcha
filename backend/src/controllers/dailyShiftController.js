const DailyShift = require('../models/DailyShift');
const Order = require('../models/Order');
const net = require('net');

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

    // Tạo HTML template cho bill
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

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tổng kết ca làm việc</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 10px;
      }
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      padding: 10px;
      margin: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .info {
      margin-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .label {
      font-weight: bold;
    }
    .value {
      text-align: right;
    }
    .section {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
    }
    .total {
      font-size: 16px;
      font-weight: bold;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #000;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LUNA MATCHA</h1>
    <p>Tổng kết ca làm việc</p>
  </div>
  
  <div class="info">
    <div class="info-row">
      <span class="label">Ngày:</span>
      <span class="value">${formatDate(shift.date)}</span>
    </div>
    <div class="info-row">
      <span class="label">Số đơn hàng:</span>
      <span class="value">${shift.orders.length}</span>
    </div>
  </div>

  <div class="section">
    <div class="info-row">
      <span class="label">Tiền đầu ca:</span>
      <span class="value">${formatCurrency(shift.startAmount)} đ</span>
    </div>
    <div class="info-row">
      <span class="label">Doanh thu tiền mặt:</span>
      <span class="value">${formatCurrency(shift.cashAmount)} đ</span>
    </div>
    <div class="info-row">
      <span class="label">Doanh thu chuyển khoản:</span>
      <span class="value">${formatCurrency(shift.bankTransferAmount)} đ</span>
    </div>
    <div class="info-row">
      <span class="label">Tổng doanh thu:</span>
      <span class="value">${formatCurrency(shift.cashAmount + shift.bankTransferAmount)} đ</span>
    </div>
  </div>

  <div class="section total">
    <div class="info-row">
      <span class="label">Tổng tiền có:</span>
      <span class="value">${formatCurrency(shift.startAmount + shift.endAmount)} đ</span>
    </div>
    <div class="info-row">
      <span class="label">Tiền lãi:</span>
      <span class="value">${formatCurrency(shift.netAmount)} đ</span>
    </div>
  </div>

  <div class="footer">
    <p>In lúc: ${new Date().toLocaleString('vi-VN')}</p>
  </div>
</body>
</html>
    `;

    // Gửi trực tiếp đến máy in qua IP
    const printerIP = '192.168.0.4';
    const printerPort = 9100; // Port mặc định cho network printer (raw printing)

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

    // Gửi đến máy in qua socket
    try {
      await new Promise((resolve, reject) => {
        const client = new net.Socket();
        let resolved = false;
        
        client.setTimeout(5000); // Timeout 5 giây
        
        client.connect(printerPort, printerIP, () => {
          console.log(`Connected to printer at ${printerIP}:${printerPort}`);
          client.write(escposCommands);
          client.end();
          if (!resolved) {
            resolved = true;
            resolve();
          }
        });

        client.on('error', (err) => {
          console.error('Printer connection error:', err);
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });

        client.on('timeout', () => {
          console.error('Printer connection timeout');
          client.destroy();
          if (!resolved) {
            resolved = true;
            reject(new Error('Printer connection timeout'));
          }
        });

        client.on('close', () => {
          console.log('Printer connection closed');
        });
      });

      // Nếu in thành công, trả về success
      res.json({ 
        message: 'Đã gửi lệnh in đến máy in thành công',
        printerIP,
        printerPort 
      });
    } catch (printerError) {
      console.error('Failed to print directly to printer:', printerError);
      // Nếu không kết nối được máy in, trả về HTML để frontend in
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    }
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

