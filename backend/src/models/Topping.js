const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên topping'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá topping'],
      min: [0, 'Giá topping phải lớn hơn hoặc bằng 0'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Topping', toppingSchema);


