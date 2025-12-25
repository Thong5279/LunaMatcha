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
router.put('/:id/start-amount', updateStartAmount);
router.post('/:id/print', printShift);

module.exports = router;



