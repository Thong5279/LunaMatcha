const express = require('express');
const router = express.Router();

// Lấy server start time từ global (được set trong server.js)
const getServerStartTime = () => {
  return global.serverStartTime || Date.now();
};

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Lightweight endpoint for uptime monitoring services (UptimeRobot, cron-job.org)
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "uptime": 12345 (milliseconds)
 * }
 * 
 * This endpoint:
 * - Does NOT access MongoDB
 * - Does NOT perform heavy operations
 * - Does NOT require authentication
 * - Safe to be called every 5 minutes
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. UptimeRobot Setup:
 *    - Go to https://uptimerobot.com
 *    - Add New Monitor
 *    - Monitor Type: HTTP(s)
 *    - Friendly Name: LunaMatcha Backend Health
 *    - URL: https://your-app-name.onrender.com/api/health
 *    - Monitoring Interval: 5 minutes (300 seconds)
 *    - Alert Contacts: Add your email/phone
 * 
 * 2. cron-job.org Setup:
 *    - Go to https://cron-job.org
 *    - Create new cron job
 *    - Title: LunaMatcha Backend Keep-Alive
 *    - Address: https://your-app-name.onrender.com/api/health
 *    - Schedule: Every 5 minutes (*\/5 * * * *)
 *    - Active: Yes
 * 
 * RECOMMENDED SETTINGS:
 * - Ping Interval: 5-10 minutes (300-600 seconds)
 *   - Too frequent (< 5 min): Wastes resources
 *   - Too infrequent (> 10 min): May allow sleep
 * - URL Format: https://your-render-app.onrender.com/api/health
 * - Expected Response: HTTP 200 with JSON body
 */
router.get('/', (req, res) => {
  const startTime = getServerStartTime();
  const uptime = Date.now() - startTime;
  
  // Log only in development (avoid noisy production logs)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Health Check] ${new Date().toISOString()} - Uptime: ${Math.floor(uptime / 1000)}s`);
  }
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptime, // milliseconds
  });
});

module.exports = router;



