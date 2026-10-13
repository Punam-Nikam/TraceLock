const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.*, c.name AS company_name, c.email AS company_reg_email,
            d.name AS department_name, t.name AS team_name
     FROM users u
     LEFT JOIN companies c   ON u.company_id    = c.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN teams t       ON u.team_id       = t.id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.company_id, u.department_id, u.team_id,
            u.employee_uid, u.full_name, u.email, u.role,
            u.status, u.profile_photo, u.last_login, u.created_at,
            c.name AS company_name,
            d.name AS department_name,
            t.name AS team_name
     FROM users u
     LEFT JOIN companies c   ON u.company_id    = c.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN teams t       ON u.team_id       = t.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0];
};

const findByCompanyEmail = async (companyEmail) => {
  const [rows] = await db.query(
    'SELECT * FROM companies WHERE email = ?',
    [companyEmail]
  );
  return rows[0];
};

const findCompanyByName = async (name) => {
  const [rows] = await db.query(
    'SELECT * FROM companies WHERE name LIKE ?',
    [`%${name}%`]
  );
  return rows;
};

const createCompany = async (name, email, phone, address) => {
  const [result] = await db.query(
    'INSERT INTO companies (name, email, phone, address) VALUES (?, ?, ?, ?)',
    [name, email, phone, address]
  );
  return result.insertId;
};

const createUser = async (companyId, deptId, teamId, employeeUid, fullName, email, passwordHash, role, status) => {
  const [result] = await db.query(
    `INSERT INTO users
      (company_id, department_id, team_id, employee_uid,
       full_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyId, deptId || null, teamId || null, employeeUid,
     fullName, email, passwordHash, role, status]
  );
  return result.insertId;
};

// Count only non-super_admin users per company for UID generation
const countUsersInCompany = async (companyId) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM users WHERE company_id = ?',
    [companyId]
  );
  return rows[0].total;
};

const updateLastLogin = async (userId) => {
  await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
};

const getPendingEmployees = async (companyId) => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, employee_uid, status, role, created_at
     FROM users
     WHERE company_id = ? AND status = 'pending'
     ORDER BY created_at DESC`,
    [companyId]
  );
  return rows;
};

const approveEmployee = async (userId, role, departmentId, teamId) => {
  await db.query(
    `UPDATE users
     SET status = 'active', role = ?, department_id = ?, team_id = ?
     WHERE id = ?`,
    [role, departmentId || null, teamId || null, userId]
  );
};

const getActiveEmployees = async (companyId, search = '') => {
  const s = `%${search}%`;
  const [rows] = await db.query(
    `SELECT u.id, u.employee_uid, u.full_name, u.email, u.role,
            u.status, u.last_login, u.created_at,
            d.name AS department_name, t.name AS team_name
     FROM users u
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN teams t       ON u.team_id       = t.id
     WHERE u.company_id = ?
       AND u.role != 'super_admin'
       AND (u.full_name LIKE ? OR u.email LIKE ? OR u.employee_uid LIKE ?)
     ORDER BY u.status ASC, u.created_at DESC`,
    [companyId, s, s, s]
  );
  return rows;
};

module.exports = {
  findByEmail, findById, findByCompanyEmail, findCompanyByName,
  createCompany, createUser, countUsersInCompany, updateLastLogin,
  getPendingEmployees, approveEmployee, getActiveEmployees
};