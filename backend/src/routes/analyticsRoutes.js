const express = require('express');
const router = express.Router();
const {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getQuarterlyAnalytics,
  getYearlyAnalytics,
  getPeakHours,
  getTopProducts,
} = require('../controllers/analyticsController');

router.get('/daily', getDailyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/quarterly', getQuarterlyAnalytics);
router.get('/yearly', getYearlyAnalytics);
router.get('/peak-hours', getPeakHours);
router.get('/products', getTopProducts);

module.exports = router;


