const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const wishlistService = require('../services/wishlist.service');

exports.get = asyncWrapper(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  return success(res, wishlist);
});

exports.add = asyncWrapper(async (req, res) => {
  const wishlist = await wishlistService.addToWishlist(req.params.productId, req.user._id);
  return success(res, wishlist, 'Added to wishlist');
});

exports.remove = asyncWrapper(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(req.params.productId, req.user._id);
  return success(res, wishlist, 'Removed from wishlist');
});
