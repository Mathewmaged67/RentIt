const AppError = require('../utils/AppError');
const validateObjectId = require('../utils/validateObjectId');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

async function getUsers(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const requestedLimit = Number(query.limit) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({})
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  const pages = Math.ceil(total / limit) || 1;
  return { users, total, page, pages };
}

async function suspendUser(id, currentUserId) {
  validateObjectId(id, 'user ID');
  if (String(id) === String(currentUserId)) {
    throw new AppError('You cannot suspend yourself', 400);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  user.isActive = !user.isActive;
  await user.save();
  return {
    data: { isActive: user.isActive },
    message: user.isActive ? 'Account activated' : 'Account suspended',
  };
}

async function deleteUser(id, currentUserId) {
  validateObjectId(id, 'user ID');
  if (String(id) === String(currentUserId)) {
    throw new AppError('You cannot delete yourself', 400);
  }

  const user = await User.findById(id).lean();
  if (!user) throw new AppError('User not found', 404);
  await User.findByIdAndDelete(id);
}

async function removeProduct(id) {
  validateObjectId(id, 'product ID');
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  product.isAvailable = false;
  await product.save();
  await Order.updateMany({ product: id, status: 'pending' }, { status: 'rejected' });
}

async function getStats() {
  const [totalUsers, totalProducts, totalOrders, pendingOrders, revenueResult] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ isAvailable: true }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  return { totalUsers, totalProducts, totalOrders, pendingOrders, totalRevenue };
}

module.exports = {
  getUsers,
  suspendUser,
  deleteUser,
  removeProduct,
  getStats,
};
