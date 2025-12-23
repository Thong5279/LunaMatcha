const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
    },
    priceSmall: {
      type: Number,
      required: [true, 'Vui lòng nhập giá size nhỏ'],
      min: [0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'],
    },
    priceLarge: {
      type: Number,
      required: [true, 'Vui lòng nhập giá size lớn'],
      min: [0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'],
    },
    image: {
      type: String,
      required: [true, 'Vui lòng upload hình ảnh sản phẩm'],
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);

