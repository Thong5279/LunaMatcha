const mongoose = require('mongoose');

const analysisHistorySchema = new mongoose.Schema(
  {
    analysis: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      required: true,
      enum: ['monthly', 'quarterly', 'yearly', 'all'],
      index: true,
    },
    periodValue: {
      type: String,
      default: null,
      index: true,
    },
    analyzeAll: {
      type: Boolean,
      required: true,
      default: false,
    },
    metadata: {
      revenue: Number,
      costs: Number,
      profit: Number,
      profitMargin: Number,
      totalOrders: Number,
      averageOrderValue: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu query performance
analysisHistorySchema.index({ createdAt: -1 }); // Sort by newest first
analysisHistorySchema.index({ period: 1, createdAt: -1 });
analysisHistorySchema.index({ analyzeAll: 1, createdAt: -1 });

module.exports = mongoose.model('AnalysisHistory', analysisHistorySchema);

