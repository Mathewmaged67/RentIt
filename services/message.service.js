const AppError = require('../utils/AppError');
const validateObjectId = require('../utils/validateObjectId');
const Message = require('../models/message.model');
const User = require('../models/user.model');

function getInbox(userId) {
  return Message.find({ recipient: userId })
    .populate('sender', 'name email')
    .populate('product', 'title')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

async function sendMessage(body, userId) {
  const { recipientId, productId, subject, body: content } = body;
  validateObjectId(recipientId, 'recipient ID');
  if (!content) throw new AppError('body is required', 400);

  const recipient = await User.findById(recipientId).lean();
  if (!recipient) throw new AppError('Recipient not found', 404);
  if (productId) validateObjectId(productId, 'product ID');

  return Message.create({
    sender: userId,
    recipient: recipientId,
    product: productId || null,
    subject: subject || '',
    body: content,
  });
}

async function getMessageById(id, userId) {
  validateObjectId(id, 'message ID');
  const message = await Message.findById(id)
    .populate('sender', 'name email')
    .populate('recipient', 'name email')
    .populate('product', 'title')
    .lean();
  if (!message) throw new AppError('Message not found', 404);

  const isSender = String(message.sender._id) === String(userId);
  const isRecipient = String(message.recipient._id) === String(userId);
  if (!isSender && !isRecipient) throw new AppError('Forbidden', 403);
  return message;
}

async function markMessageRead(id, userId) {
  validateObjectId(id, 'message ID');
  const message = await Message.findById(id);
  if (!message) throw new AppError('Message not found', 404);
  if (String(message.recipient) !== String(userId)) throw new AppError('Forbidden', 403);

  message.isRead = true;
  await message.save();
  return message;
}

module.exports = {
  getInbox,
  sendMessage,
  getMessageById,
  markMessageRead,
};
