const db = require('../config/db');

// Get all employees in company — uses 'status' not 'is_active'
const getAllByCompany = async (companyId, search = '', page = 1, limit = 20) => {
  const offset     = (page - 1) * limit;
  const searchWild = `%${search}%`;

  try {
    const [rows] = await db.query(
      `SELECT u.id, u.employee_uid, u.full_name, u.email, u.role,
              u.status, u.last_login, u.profile_photo, u.created_at,
              d.name AS department_name, t.name AS team_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t       ON u.team_id       = t.id
       WHERE u.company_id = ?
         AND u.role != 'super_admin'
         AND (u.full_name LIKE ? OR u.email LIKE ? OR u.employee_uid LIKE ?)
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [companyId, searchWild, searchWild, searchWild, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users
       WHERE company_id = ? AND role != 'super_admin'
         AND (full_name LIKE ? OR email LIKE ? OR employee_uid LIKE ?)`,
      [companyId, searchWild, searchWild, searchWild]
    );

    return { employees: rows, total, page, limit };
  } catch (err) {
    console.error('getAllByCompany error:', err);
    throw err;
  }
};

// Toggle employee status between active and inactive
const toggleActive = async (userId, isActive) => {
  const newStatus = isActive ? 'active' : 'inactive';
  const [result]  = await db.query(
    'UPDATE users SET status = ? WHERE id = ?',
    [newStatus, userId]
  );
  return result.affectedRows;
};

const updateEmployee = async (userId, fullName, departmentId, role) => {
  await db.query(
    'UPDATE users SET full_name = ?, department_id = ?, role = ? WHERE id = ?',
    [fullName, departmentId, role, userId]
  );
};

const getDepartments = async (companyId) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.name, d.created_at,
              COUNT(CASE WHEN u.status = 'active' THEN 1 END) AS employee_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       WHERE d.company_id = ?
       GROUP BY d.id, d.name, d.created_at
       ORDER BY d.name`,
      [companyId]
    );
    return rows;
  } catch (err) {
    console.error('getDepartments error:', err);
    throw err;
  }
};

const createDepartment = async (companyId, name) => {
  const [result] = await db.query(
    'INSERT INTO departments (company_id, name) VALUES (?, ?)',
    [companyId, name]
  );
  return result.insertId;
};

module.exports = {
  getAllByCompany, toggleActive, updateEmployee,
  getDepartments, createDepartment
};