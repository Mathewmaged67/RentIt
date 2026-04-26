const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const adminService = require('../services/admin.service');

exports.getUsers = asyncWrapper(async (req, res) => {
  const data = await adminService.getUsers(req.query);
  return success(res, data);
});

exports.suspendUser = asyncWrapper(async (req, res) => {
  const result = await adminService.suspendUser(req.params.id, req.user._id);
  return success(res, result.data, result.message);
});

exports.deleteUser = asyncWrapper(async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user._id);
  return success(res, null, 'User deleted');
});

exports.removeProduct = asyncWrapper(async (req, res) => {
  await adminService.removeProduct(req.params.id);
  return success(res, null, 'Product removed');
});

exports.getStats = asyncWrapper(async (req, res) => {
  const stats = await adminService.getStats();
  return success(res, stats);
});
