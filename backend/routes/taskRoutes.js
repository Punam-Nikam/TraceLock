const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const upload          = require('../middleware/uploadMiddleware');
const {
  createTask, getMyTasks, getAllTasks, updateTaskStatus,
  submitTask, reviewTask, getTaskDetail, getTaskStats
} = require('../controllers/taskController');

const router = express.Router();
router.use(verifyToken);

router.post('/',            allowRoles('super_admin','dept_head','team_lead'), upload.single('attachment'), createTask);
router.get('/my',           getMyTasks);
router.get('/',             allowRoles('super_admin','dept_head','team_lead'), getAllTasks);
router.get('/stats',        allowRoles('super_admin','dept_head','team_lead'), getTaskStats);
router.get('/:id',          getTaskDetail);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/submit',  upload.single('submission_file'), submitTask);
router.post('/:id/review',  allowRoles('super_admin','dept_head','team_lead'), reviewTask);

module.exports = router;