const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unit: {
    type: String,
    required: true,
    enum: ['ml', 'g'],
  },
});

const recipeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      enum: ['small', 'large'],
      required: true,
    },
    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Công thức phải có ít nhất một nguyên liệu',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index để mỗi sản phẩm chỉ có 1 công thức cho mỗi size
recipeSchema.index({ productId: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);

