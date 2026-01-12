const mongoose = require('mongoose');

const costSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['material', 'ice', 'other'],
    },
    customCategoryName: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Số tiền phải lớn hơn 0'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu query performance
costSchema.index({ date: 1 }); // Query theo ngày
costSchema.index({ date: 1, category: 1 }); // Query theo ngày và loại
costSchema.index({ date: -1 }); // Sort mới nhất trước

// Validation: Nếu category = 'other' thì note bắt buộc
costSchema.pre('validate', function (next) {
  if (this.category === 'other') {
    if (!this.note || this.note.trim() === '') {
      return next(new Error('Ghi chú là bắt buộc khi chọn loại "Khác"'));
    }
    if (!this.customCategoryName || this.customCategoryName.trim() === '') {
      return next(new Error('Tên loại chi phí là bắt buộc khi chọn loại "Khác"'));
    }
  }
  // Nếu category không phải 'other' thì không cần customCategoryName
  if (this.category !== 'other' && this.customCategoryName) {
    this.customCategoryName = '';
  }
  next();
});

module.exports = mongoose.model('Cost', costSchema);

