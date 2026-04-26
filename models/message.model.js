const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    subject: { type: String, trim: true, maxlength: 200, default: '' },
    body: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ recipient: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
