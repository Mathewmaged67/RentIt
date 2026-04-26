const express = require('express');
const router = express.Router();
const controller = require('../controllers/order.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roles.middleware');

router.post('/', requireAuth, requireRole('customer'), controller.create);
router.get('/my', requireAuth, requireRole('customer'), controller.getMy);
router.get('/seller', requireAuth, requireRole('seller'), controller.getSeller);
router.get('/:id', requireAuth, controller.getOne);
router.patch('/:id/status', requireAuth, requireRole('seller'), controller.updateStatus);

module.exports = router;
