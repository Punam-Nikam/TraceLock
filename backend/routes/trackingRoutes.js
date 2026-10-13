const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const { getEmployeeTracking, getEmployeeDetail, getTrackingDashboard } = require('../controllers/trackingController');

const router = express.Router();
router.use(verifyToken);
router.use(allowRoles('super_admin','admin','dept_head'));

router.get('/employees',     getEmployeeTracking);
router.get('/employee/:id',  getEmployeeDetail);
router.get('/dashboard',     getTrackingDashboard);

module.exports = router;