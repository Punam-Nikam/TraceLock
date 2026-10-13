const bcrypt        = require('bcryptjs');
const userModel     = require('../models/userModel');
const employeeModel = require('../models/employeeModel');
const { generateEmployeeUID } = require('../utils/generateId');
const { sendWelcomeEmail }    = require('../utils/emailService');
const { logAudit }            = require('../utils/logger');
const db = require('../config/db');

// GET all employees — for employee management table
const getEmployees = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const data = await employeeModel.getAllByCompany(
      req.user.company_id, search,
      parseInt(page), parseInt(limit)
    );
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('getEmployees error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET active employees only — used for dropdowns in tasks/files
const getActiveEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.employee_uid, u.role,
              d.name AS department_name, t.name AS team_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t       ON u.team_id       = t.id
       WHERE u.company_id = ?
         AND u.status = 'active'
         AND u.role != 'super_admin'
       ORDER BY u.full_name ASC`,
      [req.user.company_id]
    );
    res.json({ success: true, employees: rows });
  } catch (err) {
    console.error('getActiveEmployees error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create employee directly (admin creates with immediate active status)
const createEmployee = async (req, res) => {
  const { fullName, email, role, departmentId } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const count        = await userModel.countUsersInCompany(req.user.company_id);
    // Use company_id in UID to prevent duplicates across companies
    const employeeUID  = generateEmployeeUID(req.user.company_id, count + 1);

    const userId = await userModel.createUser(
      req.user.company_id, departmentId || null, null,
      employeeUID, fullName, email,
      passwordHash, role || 'employee', 'active'
    );

    await sendWelcomeEmail(email, fullName, tempPassword, role || 'employee');
    await logAudit(req.user.company_id, req.user.id, 'EMPLOYEE_CREATED',
                   `user:${userId}`, null, { email, role }, req.ip);

    res.status(201).json({
      success: true,
      message: `Employee ${fullName} created! Login credentials sent to ${email}.`,
      employeeUID
    });
  } catch (err) {
    console.error('createEmployee error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH toggle active/inactive
const toggleEmployee = async (req, res) => {
  try {
    const { isActive } = req.body;
    await employeeModel.toggleActive(req.params.id, isActive);
    await logAudit(
      req.user.company_id, req.user.id,
      isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
      `user:${req.params.id}`, null, null, req.ip
    );
    res.json({ success: true, message: `Employee ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET departments
const getDepartments = async (req, res) => {
  try {
    const depts = await employeeModel.getDepartments(req.user.company_id);
    res.json({ success: true, departments: depts });
  } catch (err) {
    console.error('getDepartments error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create department
const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Department name required' });
    }
    const id = await employeeModel.createDepartment(req.user.company_id, name.trim());
    await logAudit(req.user.company_id, req.user.id, 'DEPARTMENT_CREATED',
                   `dept:${id}`, null, { name }, req.ip);
    res.status(201).json({ success: true, message: 'Department created', id });
  } catch (err) {
    console.error('createDepartment error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEmployees, getActiveEmployees, createEmployee,
  toggleEmployee, getDepartments, createDepartment
};