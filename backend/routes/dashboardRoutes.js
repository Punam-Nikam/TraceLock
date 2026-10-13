const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();
router.use(verifyToken);
router.get('/', getDashboardStats);

module.exports = router;