const express = require('express');
const router = express.Router();
const controller = require('../controllers/product.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roles.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', requireAuth, requireRole('seller'), upload.array('images', 5), controller.create);
router.put('/:id', requireAuth, requireRole('seller'), upload.array('images', 5), controller.update);
router.delete('/:id', requireAuth, requireRole('seller', 'admin'), controller.remove);

module.exports = router;
