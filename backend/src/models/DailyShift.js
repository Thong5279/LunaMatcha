const mongoose = require('mongoose');

const dailyShiftSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    startAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bankTransferAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    endAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyShift', dailyShiftSchema);

