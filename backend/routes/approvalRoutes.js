const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const {
  getPendingEmployees, getAllEmployees, approveEmployee,
  rejectEmployee, reassignEmployee, getTeams, createTeam
} = require('../controllers/approvalController');

const router = express.Router();
router.use(verifyToken);
router.use(allowRoles('super_admin'));

router.get('/pending',        getPendingEmployees);
router.get('/all',            getAllEmployees);
router.post('/approve/:id',   approveEmployee);
router.post('/reject/:id',    rejectEmployee);
router.patch('/reassign/:id', reassignEmployee);
router.get('/teams',          getTeams);
router.post('/teams',         createTeam);

module.exports = router;