module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong.';
  return res.status(status).json({ success: false, message });
};
