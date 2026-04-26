const AppError = require('../utils/AppError');
const validateObjectId = require('../utils/validateObjectId');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

async function createOrder(body, userId) {
  const { productId, type, quantity, rentalDays, paymentMethod } = body;
  validateObjectId(productId, 'product ID');

  if (!['sale', 'rent'].includes(type)) throw new AppError('Invalid type', 400);
  if (!['cod', 'simulated_online'].includes(paymentMethod)) {
    throw new AppError('Invalid paymentMethod', 400);
  }

  const product = await Product.findById(productId).lean();
  if (!product || !product.isAvailable) throw new AppError('Product not found', 404);
  if (!product.availableFor.includes(type)) throw new AppError('Product does not support requested type', 400);
  if (String(product.seller) === String(userId)) throw new AppError('Cannot order your own product', 400);

  let totalAmount = 0;
  let depositAmount = 0;
  let safeQuantity = quantity || 1;
  let safeRentalDays = rentalDays || null;

  if (type === 'sale') {
    const qty = quantity || 1;
    if (qty < 1) throw new AppError('Quantity must be at least 1', 400);
    safeQuantity = qty;
    totalAmount = product.salePrice * qty;
  }

  if (type === 'rent') {
    if (!rentalDays || rentalDays < 1) throw new AppError('rentalDays must be at least 1', 400);
    safeQuantity = 1;
    safeRentalDays = rentalDays;
    totalAmount = product.rentalPricePerDay * rentalDays + product.deposit;
    depositAmount = product.deposit;
  }

  return Order.create({
    customer: userId,
    seller: product.seller,
    product: productId,
    type,
    status: 'pending',
    quantity: safeQuantity,
    rentalDays: safeRentalDays,
    totalAmount,
    depositAmount,
    paymentMethod,
  });
}

function getCustomerOrders(userId) {
  return Order.find({ customer: userId })
    .populate('product', 'title images salePrice rentalPricePerDay')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

function getSellerOrders(userId) {
  return Order.find({ seller: userId })
    .populate('product', 'title images')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

async function getOrderById(id, userId) {
  validateObjectId(id, 'order ID');
  const order = await Order.findById(id)
    .populate('product', 'title images lateFeePerDay')
    .populate('customer', 'name email')
    .populate('seller', 'name email')
    .lean();
  if (!order) throw new AppError('Order not found', 404);

  const isCustomer = String(order.customer._id) === String(userId);
  const isSeller = String(order.seller._id) === String(userId);
  if (!isCustomer && !isSeller) throw new AppError('Forbidden', 403);
  return order;
}

async function updateOrderStatus(id, status, userId) {
  if (!['approved', 'rejected', 'completed'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  validateObjectId(id, 'order ID');
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);
  if (String(order.seller) !== String(userId)) throw new AppError('Forbidden', 403);
  if (['rejected', 'completed'].includes(order.status)) throw new AppError('Order already finalised', 409);

  if (status === 'approved') {
    order.status = 'approved';
    if (order.type === 'rent') {
      const start = new Date();
      order.rentalStartDate = start;
      order.rentalEndDate = new Date(start.getTime() + order.rentalDays * 86400000);
    }
  }

  if (status === 'rejected') {
    order.status = 'rejected';
  }

  if (status === 'completed') {
    order.status = 'completed';
    if (order.type === 'rent' && order.rentalEndDate) {
      const today = new Date();
      if (today > order.rentalEndDate) {
        const product = await Product.findById(order.product).lean();
        const overdueDays = Math.ceil((today - order.rentalEndDate) / 86400000);
        order.lateFee = overdueDays * product.lateFeePerDay;
      }
    }
  }

  await order.save();
  return order;
}

module.exports = {
  createOrder,
  getCustomerOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
};
