const express = require('express');
const router = express.Router();
const {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
} = require('../controllers/analysisHistoryController');

// POST /api/analysis-history - Create new analysis
router.post('/', createAnalysis);

// GET /api/analysis-history - Get list with filters
router.get('/', getAnalyses);

// GET /api/analysis-history/:id - Get single analysis
router.get('/:id', getAnalysisById);

// DELETE /api/analysis-history/:id - Delete analysis
router.delete('/:id', deleteAnalysis);

module.exports = router;

