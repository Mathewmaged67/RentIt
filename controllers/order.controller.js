const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const orderService = require('../services/order.service');

exports.create = asyncWrapper(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user._id);
  return success(res, order, 'Created', 201);
});

exports.getMy = asyncWrapper(async (req, res) => {
  const orders = await orderService.getCustomerOrders(req.user._id);
  return success(res, orders);
});

exports.getSeller = asyncWrapper(async (req, res) => {
  const orders = await orderService.getSellerOrders(req.user._id);
  return success(res, orders);
});

exports.getOne = asyncWrapper(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id);
  return success(res, order);
});

exports.updateStatus = asyncWrapper(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user._id);
  return success(res, order, 'Updated');
});
