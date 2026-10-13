const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const upload          = require('../middleware/uploadMiddleware');
const {
  uploadFile, getMyFiles, getAllFiles,
  downloadFile, detectLeak, getFileLogs
} = require('../controllers/fileController');

const router = express.Router();
router.use(verifyToken);

router.post('/upload',      allowRoles('super_admin','dept_head'), upload.single('file'), uploadFile);
router.get('/',             getMyFiles);
router.get('/all',          allowRoles('super_admin','dept_head'), getAllFiles);
router.get('/:id/download', downloadFile);
router.post('/detect-leak', allowRoles('super_admin'),             upload.single('file'), detectLeak);
router.get('/:id/logs',     allowRoles('super_admin','dept_head'), getFileLogs);

module.exports = router;