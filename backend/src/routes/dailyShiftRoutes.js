const express = require('express');
const router = express.Router();
const {
  getOrCreateShift,
  updateStartAmount,
  getShifts,
  printShift,
} = require('../controllers/dailyShiftController');

router.get('/', getOrCreateShift);
router.get('/list', getShifts);
router.post('/:id/print', printShift); // Đặt trước route /:id/start-amount để tránh conflict
router.put('/:id/start-amount', updateStartAmount);

module.exports = router;



