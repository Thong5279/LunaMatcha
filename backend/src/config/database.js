const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Connection pooling options để tối ưu hiệu suất
    const options = {
      maxPoolSize: 10, // Số connection tối đa trong pool
      minPoolSize: 2, // Giữ 2 connection luôn sẵn sàng (giúp wake up nhanh hơn)
      serverSelectionTimeoutMS: 5000, // Timeout 5 giây khi chọn server
      socketTimeoutMS: 45000, // Timeout 45 giây cho socket operations
      connectTimeoutMS: 10000, // Timeout 10 giây khi kết nối
      heartbeatFrequencyMS: 10000, // Gửi heartbeat mỗi 10 giây để giữ connection alive
      retryWrites: true, // Retry writes nếu fail
      retryReads: true, // Retry reads nếu fail
    };
    
    const conn = await mongoose.connect(process.env.MONGGODB_CONNECTIONSTRING, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;




