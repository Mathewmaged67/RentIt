const AppError = require('../utils/AppError');
const validateObjectId = require('../utils/validateObjectId');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

function normalizeAvailableFor(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }
  return [];
}

function validatePricingByMode(availableFor, payload) {
  if (!Array.isArray(availableFor) || availableFor.length < 1) {
    throw new AppError('availableFor must include at least one of sale or rent', 400);
  }

  const allowed = ['sale', 'rent'];
  const validModes = availableFor.every(mode => allowed.includes(mode));
  if (!validModes) {
    throw new AppError('availableFor must include only sale or rent', 400);
  }

  if (availableFor.includes('sale')) {
    if (payload.salePrice === undefined || Number(payload.salePrice) <= 0) {
      throw new AppError('salePrice is required and must be greater than 0', 400);
    }
  }

  if (availableFor.includes('rent')) {
    if (payload.rentalPricePerDay === undefined || Number(payload.rentalPricePerDay) < 0) {
      throw new AppError('rentalPricePerDay is required and must be greater than or equal to 0', 400);
    }
    if (payload.deposit === undefined || Number(payload.deposit) < 0) {
      throw new AppError('deposit is required and must be greater than or equal to 0', 400);
    }
    if (payload.lateFeePerDay === undefined || Number(payload.lateFeePerDay) < 0) {
      throw new AppError('lateFeePerDay is required and must be greater than or equal to 0', 400);
    }
  }
}

async function getAllProducts(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const requestedLimit = Number(query.limit) || 12;
  const limit = Math.min(Math.max(requestedLimit, 1), 50);
  const skip = (page - 1) * limit;

  const filter = { isAvailable: true };
  if (query.category) {
    filter.category = query.category;
  }
  if (query.availableFor) {
    filter.availableFor = { $in: [query.availableFor] };
  }

  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;
  if (minPrice !== null || maxPrice !== null) {
    const saleRange = {};
    const rentRange = {};
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      saleRange.$gte = minPrice;
      rentRange.$gte = minPrice;
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      saleRange.$lte = maxPrice;
      rentRange.$lte = maxPrice;
    }
    filter.$or = [{ salePrice: saleRange }, { rentalPricePerDay: rentRange }];
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / limit) || 1;
  return { products, total, page, pages };
}

async function getProductById(id) {
  validateObjectId(id, 'product ID');
  const product = await Product.findOne({ _id: id, isAvailable: true }).populate('seller', 'name email').lean();
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

async function createProduct(body, files, userId) {
  const { title, description, category } = body;
  const availableFor = normalizeAvailableFor(body.availableFor);

  if (!title) throw new AppError('title is required', 400);
  if (!description) throw new AppError('description is required', 400);
  if (!category) throw new AppError('category is required', 400);
  if (!body.availableFor) throw new AppError('availableFor is required', 400);

  validatePricingByMode(availableFor, body);
  const images = files ? files.map(file => file.path) : [];

  return Product.create({
    seller: userId,
    title,
    description,
    category,
    images,
    availableFor,
    salePrice: body.salePrice ?? null,
    rentalPricePerDay: body.rentalPricePerDay ?? null,
    deposit: body.deposit ?? null,
    lateFeePerDay: body.lateFeePerDay ?? null,
  });
}

async function updateProduct(id, body, files, userId) {
  validateObjectId(id, 'product ID');
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  if (String(product.seller) !== String(userId)) throw new AppError('Not authorized', 403);

  const allowedFields = [
    'title',
    'description',
    'category',
    'availableFor',
    'salePrice',
    'rentalPricePerDay',
    'deposit',
    'lateFeePerDay',
  ];

  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      product[field] = field === 'availableFor' ? normalizeAvailableFor(body[field]) : body[field];
    }
  });

  if (files && files.length) {
    product.images = files.map(file => file.path);
  }

  validatePricingByMode(product.availableFor, product);
  await product.save();
  return product;
}

async function removeProduct(id, userId, role) {
  validateObjectId(id, 'product ID');
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  const isOwner = String(product.seller) === String(userId);
  if (!isOwner && role !== 'admin') throw new AppError('Not authorized', 403);

  product.isAvailable = false;
  await product.save();
  await Order.updateMany({ product: id, status: 'pending' }, { status: 'rejected' });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  removeProduct,
};
