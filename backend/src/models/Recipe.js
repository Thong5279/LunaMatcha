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
      unique: true, // Mỗi product chỉ có 1 recipe document
    },
    ingredientsSmall: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Công thức size nhỏ phải có ít nhất một nguyên liệu',
      },
    },
    ingredientsLarge: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Công thức size lớn phải có ít nhất một nguyên liệu',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique index trên productId - mỗi product chỉ có 1 recipe document
recipeSchema.index({ productId: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);

