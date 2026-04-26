const express = require('express');
const router = express.Router();
const controller = require('../controllers/message.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roles.middleware');

router.get('/inbox', requireAuth, controller.getInbox);
router.post('/', requireAuth, requireRole('customer'), controller.send);
router.get('/:id', requireAuth, controller.getOne);
router.patch('/:id/read', requireAuth, controller.markRead);

module.exports = router;
