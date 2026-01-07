const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Connection pooling options đơn giản hóa - giảm delay khi wake up
    const options = {
      maxPoolSize: 5, // Giảm từ 10 xuống 5 (đủ cho 10 sản phẩm + 10 toppings)
      // Loại bỏ minPoolSize - không cần giữ connections khi sleep
      serverSelectionTimeoutMS: 3000, // Giảm từ 5000 xuống 3000
      socketTimeoutMS: 30000, // Giảm từ 45000 xuống 30000
      connectTimeoutMS: 5000, // Giảm từ 10000 xuống 5000
      // Loại bỏ heartbeatFrequencyMS - không cần heartbeat khi sleep
      retryWrites: true, // Retry writes nếu fail
      retryReads: true, // Retry reads nếu fail
    };
    
    const conn = await mongoose.connect(process.env.MONGGODB_CONNECTIONSTRING, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: max=${options.maxPoolSize} (simplified - no minPoolSize)`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;




