const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['sale', 'rent'], required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    quantity: { type: Number, default: 1, min: 1 },
    rentalDays: { type: Number, default: null },
    rentalStartDate: { type: Date, default: null },
    rentalEndDate: { type: Date, default: null },
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cod', 'simulated_online'], required: true },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1 });
orderSchema.index({ seller: 1 });
orderSchema.index({ product: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
