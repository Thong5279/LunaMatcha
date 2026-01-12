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
  // #region agent log
  console.log('[DEBUG] pre-validate hook entry', {
    category: this.category,
    note: this.note,
    customCategoryName: this.customCategoryName,
    nextType: typeof next,
    nextIsFunction: typeof next === 'function'
  });
  // #endregion
  
  // Ensure next is a function
  if (typeof next !== 'function') {
    console.error('[DEBUG] next is not a function!', { nextType: typeof next, next });
    return;
  }
  
  try {
    if (this.category === 'other') {
      // #region agent log
      console.log('[DEBUG] category is other - checking validation', {
        noteExists: !!this.note,
        noteValue: this.note,
        customNameExists: !!this.customCategoryName,
        customNameValue: this.customCategoryName
      });
      // #endregion
      
      // Safe trim - check if note exists and is string before calling trim
      const noteTrimmed = (this.note && typeof this.note === 'string') ? this.note.trim() : '';
      if (!noteTrimmed) {
        // #region agent log
        console.log('[DEBUG] validation error - note required');
        // #endregion
        return next(new Error('Ghi chú là bắt buộc khi chọn loại "Khác"'));
      }
      
      // Safe trim - check if customCategoryName exists and is string before calling trim
      const customNameTrimmed = (this.customCategoryName && typeof this.customCategoryName === 'string') ? this.customCategoryName.trim() : '';
      if (!customNameTrimmed) {
        // #region agent log
        console.log('[DEBUG] validation error - customCategoryName required');
        // #endregion
        return next(new Error('Tên loại chi phí là bắt buộc khi chọn loại "Khác"'));
      }
    }
    // Nếu category không phải 'other' thì không cần customCategoryName
    if (this.category !== 'other' && this.customCategoryName) {
      this.customCategoryName = '';
    }
    
    // #region agent log
    console.log('[DEBUG] pre-validate hook calling next()');
    // #endregion
    
    next();
  } catch (hookError) {
    // #region agent log
    console.error('[DEBUG] pre-validate hook error caught', {
      errorName: hookError?.name,
      errorMessage: hookError?.message,
      errorStack: hookError?.stack,
      nextType: typeof next
    });
    // #endregion
    if (typeof next === 'function') {
      next(hookError);
    } else {
      console.error('[DEBUG] Cannot call next - it is not a function!', { nextType: typeof next });
      throw hookError;
    }
  }
});

module.exports = mongoose.model('Cost', costSchema);

