const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Store server start time for health check uptime calculation
global.serverStartTime = Date.now();

const app = express();

// Middleware
// Response compression - giảm response size 60-80%
app.use(compression());
// CORS configuration - Đơn giản hóa để fix lỗi production
// Cho phép tất cả origins để tránh lỗi CORS
app.use((req, res, next) => {
  // Log để debug
  console.log('Request origin:', req.headers.origin);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Cũng dùng cors middleware để đảm bảo
app.use(cors({
  origin: '*', // Cho phép tất cả origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const healthRoutes = require('./routes/healthRoutes');

// Routes
// Health check route - placed FIRST for fast response and keep-alive services
app.use('/api/health', healthRoutes);
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/toppings', require('./routes/toppingRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/shifts', require('./routes/dailyShiftRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/costs', require('./routes/costRoutes'));

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

