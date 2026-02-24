const express = require('express');
const router = express.Router();
const {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getQuarterlyAnalytics,
  getYearlyAnalytics,
  getPeakHours,
  getPeakHoursWeekly,
  getPeakHoursMonthly,
  getPeakHoursQuarterly,
  getPeakHoursYearly,
  getTopProducts,
} = require('../controllers/analyticsController');

router.get('/daily', getDailyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/quarterly', getQuarterlyAnalytics);
router.get('/yearly', getYearlyAnalytics);
router.get('/peak-hours', getPeakHours);
router.get('/peak-hours/weekly', getPeakHoursWeekly);
router.get('/peak-hours/monthly', getPeakHoursMonthly);
router.get('/peak-hours/quarterly', getPeakHoursQuarterly);
router.get('/peak-hours/yearly', getPeakHoursYearly);
router.get('/products', getTopProducts);

module.exports = router;






