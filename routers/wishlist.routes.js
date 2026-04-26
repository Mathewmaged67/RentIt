const express = require('express');
const router = express.Router();
const controller = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roles.middleware');

router.get('/:productId', requireAuth, requireRole('customer'), controller.get);
router.post('/:productId', requireAuth, requireRole('customer'), controller.add);
router.delete('/:productId', requireAuth, requireRole('customer'), controller.remove);

module.exports = router;
