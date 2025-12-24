const express = require('express');
const router = express.Router();
const {
  getOrCreateShift,
  updateStartAmount,
  getShifts,
} = require('../controllers/dailyShiftController');

router.get('/', getOrCreateShift);
router.get('/list', getShifts);
router.put('/:id/start-amount', updateStartAmount);

module.exports = router;



