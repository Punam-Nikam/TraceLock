const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { allowRoles }  = require('../middleware/roleMiddleware');
const {
  getEmployees, getActiveEmployees, createEmployee,
  toggleEmployee, getDepartments, createDepartment
} = require('../controllers/employeeController');

const router = express.Router();
router.use(verifyToken);

// Active employees for dropdowns — ANY logged in user can call this
router.get('/active',          getActiveEmployees);

// Full employee list with pagination
router.get('/',                allowRoles('super_admin','dept_head','team_lead'), getEmployees);

// Create employee (admin creates directly)
router.post('/',               allowRoles('super_admin'), createEmployee);

// Toggle active/inactive
router.patch('/:id/toggle',    allowRoles('super_admin'), toggleEmployee);

// Departments
router.get('/departments',     getDepartments);
router.post('/departments',    allowRoles('super_admin'), createDepartment);

module.exports = router;