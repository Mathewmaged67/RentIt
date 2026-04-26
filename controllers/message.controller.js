const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const messageService = require('../services/message.service');

exports.getInbox = asyncWrapper(async (req, res) => {
  const messages = await messageService.getInbox(req.user._id);
  return success(res, messages);
});

exports.send = asyncWrapper(async (req, res) => {
  const message = await messageService.sendMessage(req.body, req.user._id);
  return success(res, message, 'Created', 201);
});

exports.getOne = asyncWrapper(async (req, res) => {
  const message = await messageService.getMessageById(req.params.id, req.user._id);
  return success(res, message);
});

exports.markRead = asyncWrapper(async (req, res) => {
  const message = await messageService.markMessageRead(req.params.id, req.user._id);
  return success(res, message, 'Marked as read');
});
