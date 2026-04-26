const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const productService = require('../services/product.service');

exports.getAll = asyncWrapper(async (req, res) => {
  const data = await productService.getAllProducts(req.query);
  return success(res, data);
});

exports.getOne = asyncWrapper(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return success(res, product);
});

exports.create = asyncWrapper(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files, req.user._id);
  return success(res, product, 'Created', 201);
});

exports.update = asyncWrapper(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files, req.user._id);
  return success(res, product, 'Updated');
});

exports.remove = asyncWrapper(async (req, res) => {
  await productService.removeProduct(req.params.id, req.user._id, req.user.role);
  return success(res, null, 'Product removed');
});
