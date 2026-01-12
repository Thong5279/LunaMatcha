const AnalysisHistory = require('../models/AnalysisHistory');

// Create new analysis history
const createAnalysis = async (req, res) => {
  try {
    const { analysis, period, periodValue, analyzeAll, metadata } = req.body;

    if (!analysis || !period) {
      return res.status(400).json({ message: 'Phân tích và period là bắt buộc' });
    }

    const analysisHistory = new AnalysisHistory({
      analysis,
      period,
      periodValue: periodValue || null,
      analyzeAll: analyzeAll || false,
      metadata: metadata || {},
    });

    await analysisHistory.save();
    res.status(201).json(analysisHistory);
  } catch (error) {
    console.error('Error creating analysis history:', error);
    res.status(500).json({ message: 'Lỗi khi lưu phân tích' });
  }
};

// Get list of analyses with filters
const getAnalyses = async (req, res) => {
  try {
    const { startDate, endDate, period, analyzeAll } = req.query;

    // Build query
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Period filter
    if (period && period !== 'all') {
      query.period = period;
    }

    // AnalyzeAll filter
    if (analyzeAll !== undefined) {
      query.analyzeAll = analyzeAll === 'true';
    }

    // Get analyses sorted by newest first
    const analyses = await AnalysisHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 most recent

    res.json(analyses);
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({ message: 'Lỗi khi tải lịch sử phân tích' });
  }
};

// Get single analysis by ID
const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await AnalysisHistory.findById(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Không tìm thấy phân tích' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Lỗi khi tải phân tích' });
  }
};

// Delete analysis by ID
const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await AnalysisHistory.findByIdAndDelete(id);

    if (!analysis) {
      return res.status(404).json({ message: 'Không tìm thấy phân tích' });
    }

    res.json({ message: 'Đã xóa phân tích thành công' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ message: 'Lỗi khi xóa phân tích' });
  }
};

module.exports = {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
};

