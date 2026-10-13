const db = require('../config/db');

// Get all employees in a company with department name
const getAllByCompany = async (companyId, search = '', page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const searchWild = `%${search}%`;

  const [rows] = await db.query(
    `SELECT u.id, u.employee_uid, u.full_name, u.email, u.role,
            u.is_active, u.last_login, u.profile_photo, u.created_at,
            d.name AS department_name
     FROM users u
     LEFT JOIN departments d ON u.department_id = d.id
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
};

// Toggle employee active/inactive
const toggleActive = async (userId, isActive) => {
  const [result] = await db.query(
    'UPDATE users SET is_active = ? WHERE id = ?',
    [isActive, userId]
  );
  return result.affectedRows;
};

// Update employee details
const updateEmployee = async (userId, fullName, departmentId, role) => {
  await db.query(
    'UPDATE users SET full_name = ?, department_id = ?, role = ? WHERE id = ?',
    [fullName, departmentId, role, userId]
  );
};

// Get all departments in a company
const getDepartments = async (companyId) => {
  const [rows] = await db.query(
    'SELECT * FROM departments WHERE company_id = ?',
    [companyId]
  );
  return rows;
};

// Create a department
const createDepartment = async (companyId, name) => {
  const [result] = await db.query(
    'INSERT INTO departments (company_id, name) VALUES (?, ?)',
    [companyId, name]
  );
  return result.insertId;
};

module.exports = { getAllByCompany, toggleActive, updateEmployee, getDepartments, createDepartment };