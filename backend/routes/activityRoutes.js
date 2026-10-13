const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const {
  getMyActivity, getEmployeeActivity,
  getAlerts, resolveAlert, logPageVisit
} = require('../controllers/activityController');

const router = express.Router();
router.use(verifyToken);

router.get('/my',                   getMyActivity);
router.get('/employee/:id',         allowRoles('super_admin','dept_head','team_lead'), getEmployeeActivity);
router.get('/alerts',               allowRoles('super_admin'), getAlerts);
router.patch('/alerts/:id/resolve', allowRoles('super_admin'), resolveAlert);
router.post('/log',                 logPageVisit);

module.exports = router;