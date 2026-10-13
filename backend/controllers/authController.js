const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const { generateEmployeeUID } = require('../utils/generateId');
const { logAudit }            = require('../utils/logger');
require('dotenv').config();

// ── REGISTER COMPANY (Super Admin) ──────────────────────────────
const registerCompany = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { companyName, companyEmail, companyPhone,
          companyAddress, adminName, adminEmail, adminPassword } = req.body;

  try {
    const existingCompany = await userModel.findByCompanyEmail(companyEmail);
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'A company with this email is already registered' });
    }

    const existingUser = await userModel.findByEmail(adminEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    // Create company first
    const companyId    = await userModel.createCompany(companyName, companyEmail, companyPhone, companyAddress);
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Count existing users in THIS company (will be 0 for new company)
    const count       = await userModel.countUsersInCompany(companyId);
    // Generate UID with companyId prefix to ensure global uniqueness
    const employeeUID = generateEmployeeUID(companyId, count + 1);

    const userId = await userModel.createUser(
      companyId, null, null,
      employeeUID, adminName, adminEmail,
      passwordHash, 'super_admin', 'active'
    );

    await logAudit(companyId, userId, 'COMPANY_REGISTERED',
                   `company:${companyId}`, null, { companyName }, req.ip);

    res.status(201).json({
      success: true,
      message: `Company "${companyName}" registered! You can now login as Super Admin.`
    });

  } catch (err) {
    console.error('Register company error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── EMPLOYEE SELF-REGISTER ──────────────────────────────────────
// Employee only needs: name, email, password, company email
// Role/dept assigned by admin after approval
const registerEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { fullName, email, password, companyEmail } = req.body;

  try {
    // Find company by its registered email
    const company = await userModel.findByCompanyEmail(companyEmail);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'No company found with that email. Please check with your HR or manager for the correct company email.'
      });
    }

    if (!company.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This company account is currently inactive.'
      });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Count users in this company for UID
    const count       = await userModel.countUsersInCompany(company.id);
    const employeeUID = generateEmployeeUID(company.id, count + 1);

    const userId = await userModel.createUser(
      company.id, null, null,
      employeeUID, fullName, email,
      passwordHash, 'employee', 'pending'
    );

    await logAudit(company.id, userId, 'EMPLOYEE_SELF_REGISTERED',
                   `user:${userId}`, null, { email, companyId: company.id }, req.ip);

    res.status(201).json({
      success: true,
      companyName: company.name,
      message: `Registration successful! Your account at "${company.name}" is pending approval from the admin.`
    });

  } catch (err) {
    console.error('Employee register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LOGIN (All roles — one login page) ─────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        status: 'pending',
        companyName: user.company_name,
        message: `Your account at "${user.company_name}" is pending approval from the admin. Please wait or contact your administrator.`
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        status: 'inactive',
        message: 'Your account has been deactivated. Please contact your administrator.'
      });
    }

    const token = jwt.sign(
      {
        id:           user.id,
        email:        user.email,
        role:         user.role,
        status:       user.status,
        company_id:   user.company_id,
        employee_uid: user.employee_uid
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await userModel.updateLastLogin(user.id);
    await logAudit(user.company_id, user.id, 'USER_LOGIN', null, null, null, req.ip);

    const dashboardMap = {
      super_admin: '/admin',
      dept_head:   '/dept-head',
      team_lead:   '/team-lead',
      employee:    '/employee'
    };

    res.json({
      success:  true,
      message:  `Welcome back, ${user.full_name}!`,
      token,
      redirect: dashboardMap[user.role] || '/employee',
      user: {
        id:              user.id,
        full_name:       user.full_name,
        email:           user.email,
        role:            user.role,
        status:          user.status,
        company_id:      user.company_id,
        company_name:    user.company_name,
        employee_uid:    user.employee_uid,
        department_name: user.department_name,
        team_name:       user.team_name,
        profile_photo:   user.profile_photo,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET CURRENT USER ────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SEARCH COMPANIES (for employee registration dropdown) ────────
const searchCompanies = async (req, res) => {
  const { query } = req.query;
  try {
    const [rows] = require('../config/db').query(
      'SELECT id, name, email FROM companies WHERE name LIKE ? AND is_active = TRUE LIMIT 10',
      [`%${query}%`]
    );
    res.json({ success: true, companies: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── VALIDATION RULES ────────────────────────────────────────────
const registerCompanyValidation = [
  body('companyName').notEmpty().withMessage('Company name required'),
  body('companyEmail').isEmail().withMessage('Valid company email required'),
  body('adminName').notEmpty().withMessage('Your name is required'),
  body('adminEmail').isEmail().withMessage('Valid email required'),
  body('adminPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const registerEmployeeValidation = [
  body('fullName').notEmpty().withMessage('Full name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password minimum 8 characters'),
  body('companyEmail').isEmail().withMessage('Valid company email required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

module.exports = {
  registerCompany, registerEmployee, login, getMe, searchCompanies,
  registerCompanyValidation, registerEmployeeValidation, loginValidation
};