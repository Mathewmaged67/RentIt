const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncWrapper = require('../utils/asyncWrapper');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const User = require('../models/user.model');

function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
}

exports.register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name) throw new AppError('Name is required', 400);
  if (!email) throw new AppError('Email is required', 400);
  if (!password) throw new AppError('Password is required', 400);

  const exists = await User.findOne({ email }).lean();
  if (exists) throw new AppError('Email already in use', 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return success(
    res,
    {
      user: { _id: user._id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    },
    'Registered successfully',
    201
  );
});

exports.login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  if (!email) throw new AppError('Email is required', 400);
  if (!password) throw new AppError('Password is required', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  return success(
    res,
    {
      user: { _id: user._id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    },
    'Logged in successfully'
  );
});

exports.refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token is required', 400);

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save();

  return success(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Tokens refreshed'
  );
});

exports.logout = asyncWrapper(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return success(res, null, 'Logged out successfully');
});
