const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    return cb(null, true);
  }
  return cb(new AppError('Images only (jpeg, jpg, png, webp)', 400));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { upload };
