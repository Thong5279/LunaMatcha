const express = require('express');
const router = express.Router();
const { analyzeBusinessData } = require('../controllers/chatgptController');

// POST /api/chatgpt/analyze - Analyze business data using ChatGPT
router.post('/analyze', analyzeBusinessData);

module.exports = router;

