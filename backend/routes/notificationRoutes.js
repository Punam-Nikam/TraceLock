const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(verifyToken);

router.get('/',           getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);

module.exports = router;