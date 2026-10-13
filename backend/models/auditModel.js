const db = require('../config/db');

const getAuditLogs = async (companyId, filters = {}, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query    = `
    SELECT al.*, u.full_name, u.employee_uid, u.email
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.company_id = ?
  `;
  const params = [companyId];

  if (filters.from)   { query += ' AND al.created_at >= ?'; params.push(filters.from); }
  if (filters.to)     { query += ' AND al.created_at <= ?'; params.push(filters.to); }
  if (filters.userId) { query += ' AND al.user_id = ?';     params.push(filters.userId); }
  if (filters.action) { query += ' AND al.action LIKE ?';   params.push(`%${filters.action}%`); }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
};

module.exports = { getAuditLogs };