const db = require('../config/db');

const getAuditLogs = async (req, res) => {
  const { from, to, userId, action, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query  = `
    SELECT al.*, u.full_name, u.employee_uid, u.email
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.company_id = ?
  `;
  const params = [req.user.company_id];

  if (from)   { query += ' AND al.created_at >= ?'; params.push(from); }
  if (to)     { query += ' AND al.created_at <= ?'; params.push(to); }
  if (userId) { query += ' AND al.user_id = ?';     params.push(userId); }
  if (action) { query += ' AND al.action LIKE ?';   params.push(`%${action}%`); }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  try {
    const [rows] = await db.query(query, params);
    res.json({ success: true, logs: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportCSV = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT al.created_at, u.full_name, u.employee_uid,
              al.action, al.resource, al.ip_address
       FROM audit_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.company_id = ?
       ORDER BY al.created_at DESC`,
      [req.user.company_id]
    );

    const header   = 'Timestamp,Employee,UID,Action,Resource,IP\n';
    const rows_csv = rows.map(r =>
      `"${r.created_at}","${r.full_name}","${r.employee_uid}","${r.action}","${r.resource||''}","${r.ip_address||''}"`
    ).join('\n');

    res.setHeader('Content-Type',        'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tracelock-audit.csv"');
    res.send(header + rows_csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAuditLogs, exportCSV };