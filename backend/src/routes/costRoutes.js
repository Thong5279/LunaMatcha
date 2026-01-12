const express = require('express');
const router = express.Router();
const {
  getCosts,
  getCostById,
  createCost,
  updateCost,
  deleteCost,
  getCostSummary,
} = require('../controllers/costController');

router.get('/summary/:month/:year', getCostSummary);
router.get('/', getCosts);
router.get('/:id', getCostById);
router.post('/', createCost);
router.put('/:id', updateCost);
router.delete('/:id', deleteCost);

module.exports = router;

