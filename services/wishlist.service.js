const AppError = require('../utils/AppError');
const validateObjectId = require('../utils/validateObjectId');
const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');

async function getWishlist(userId) {
  const wishlist = await Wishlist.findOne({ customer: userId })
    .populate('products', 'title images salePrice rentalPricePerDay availableFor isAvailable')
    .lean();
  return { products: wishlist?.products || [] };
}

async function addToWishlist(productId, userId) {
  validateObjectId(productId, 'product ID');
  const product = await Product.findOne({ _id: productId, isAvailable: true }).lean();
  if (!product) throw new AppError('Product not found', 404);

  const wishlist = await Wishlist.findOneAndUpdate(
    { customer: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  )
    .populate('products', 'title images salePrice rentalPricePerDay availableFor isAvailable')
    .lean();

  return wishlist;
}

async function removeFromWishlist(productId, userId) {
  validateObjectId(productId, 'product ID');
  const wishlist = await Wishlist.findOneAndUpdate(
    { customer: userId },
    { $pull: { products: productId } },
    { new: true }
  )
    .populate('products', 'title images salePrice rentalPricePerDay availableFor isAvailable')
    .lean();

  return wishlist || { products: [] };
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
