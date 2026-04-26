const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    images: [{ type: String }],
    availableFor: [{ type: String, enum: ['sale', 'rent'] }],
    salePrice: { type: Number, default: null },
    rentalPricePerDay: { type: Number, default: null },
    deposit: { type: Number, default: null },
    lateFeePerDay: { type: Number, default: null },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);
