const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roles.middleware');

router.get('/users', requireAuth, requireRole('admin'), controller.getUsers);
router.patch('/users/:id/suspend', requireAuth, requireRole('admin'), controller.suspendUser);
router.delete('/users/:id', requireAuth, requireRole('admin'), controller.deleteUser);
router.delete('/products/:id', requireAuth, requireRole('admin'), controller.removeProduct);
router.get('/stats', requireAuth, requireRole('admin'), controller.getStats);

module.exports = router;
