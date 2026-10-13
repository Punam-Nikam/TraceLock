const db        = require('../config/db');
const userModel = require('../models/userModel');
const { logAudit } = require('../utils/logger');
const { sendApprovalEmail } = require('../utils/emailService');

const getPendingEmployees = async (req, res) => {
  try {
    const employees = await userModel.getPendingEmployees(req.user.company_id);
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const employees = await userModel.getActiveEmployees(req.user.company_id, search);
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const approveEmployee = async (req, res) => {
  const { role, departmentId, teamId } = req.body;
  const allowedRoles = ['employee','team_lead','dept_head'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role assignment' });
  }

  try {
    await userModel.approveEmployee(req.params.id, role, departmentId, teamId);

    // Get employee info for email
    const [[emp]] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [req.params.id]);
    let deptName = null;
    if (departmentId) {
      const [[dept]] = await db.query('SELECT name FROM departments WHERE id = ?', [departmentId]);
      deptName = dept?.name;
    }

    // Send approval email
    await sendApprovalEmail(emp.email, emp.full_name, role, deptName);

    // In-app notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'system')`,
      [
        req.params.id,
        '✅ Account Approved!',
        `Your account has been approved. Your role is: ${role.replace('_', ' ')}.`
      ]
    );

    await logAudit(
      req.user.company_id, req.user.id,
      'EMPLOYEE_APPROVED', `user:${req.params.id}`,
      null, { role, departmentId, teamId }, req.ip
    );

    res.json({ success: true, message: 'Employee approved and activated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const rejectEmployee = async (req, res) => {
  try {
    await db.query(
      `UPDATE users SET status = 'inactive' WHERE id = ? AND company_id = ?`,
      [req.params.id, req.user.company_id]
    );

    await logAudit(
      req.user.company_id, req.user.id,
      'EMPLOYEE_REJECTED', `user:${req.params.id}`,
      null, null, req.ip
    );

    res.json({ success: true, message: 'Employee rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reassignEmployee = async (req, res) => {
  const { role, departmentId, teamId } = req.body;
  try {
    const [[old]] = await db.query(
      'SELECT role, department_id, team_id FROM users WHERE id = ?',
      [req.params.id]
    );

    await db.query(
      `UPDATE users SET role = ?, department_id = ?, team_id = ? WHERE id = ? AND company_id = ?`,
      [role, departmentId || null, teamId || null, req.params.id, req.user.company_id]
    );

    await logAudit(
      req.user.company_id, req.user.id,
      'EMPLOYEE_REASSIGNED', `user:${req.params.id}`,
      old, { role, departmentId, teamId }, req.ip
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'system')`,
      [
        req.params.id,
        '🔄 Role Updated',
        `Your role has been updated to: ${role.replace('_', ' ')}`
      ]
    );

    res.json({ success: true, message: 'Employee reassigned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTeams = async (req, res) => {
  try {
    const [teams] = await db.query(
      `SELECT t.*, d.name AS department_name, u.full_name AS lead_name
       FROM teams t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN users u       ON t.lead_id       = u.id
       WHERE t.company_id = ?
       ORDER BY d.name, t.name`,
      [req.user.company_id]
    );
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTeam = async (req, res) => {
  const { name, departmentId } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO teams (company_id, department_id, name) VALUES (?, ?, ?)',
      [req.user.company_id, departmentId, name]
    );
    res.status(201).json({ success: true, message: 'Team created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPendingEmployees, getAllEmployees, approveEmployee,
  rejectEmployee, reassignEmployee, getTeams, createTeam
};