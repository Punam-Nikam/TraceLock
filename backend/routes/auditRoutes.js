const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const { getAuditLogs, exportCSV } = require('../controllers/auditController');

const router = express.Router();
router.use(verifyToken);
router.use(allowRoles('super_admin'));

router.get('/',       getAuditLogs);
router.get('/export', exportCSV);

module.exports = router;