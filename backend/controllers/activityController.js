const db = require('../config/db');
const { sendSuspiciousActivityAlert } = require('../utils/emailService');

const getMyActivity = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json({ success: true, activities: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEmployeeActivity = async (req, res) => {
  try {
    const { from, to, suspicious } = req.query;
    let query  = `
      SELECT al.*, u.full_name, u.employee_uid
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
    `;
    const params = [req.params.id];

    if (from)                { query += ' AND al.created_at >= ?';     params.push(from); }
    if (to)                  { query += ' AND al.created_at <= ?';     params.push(to); }
    if (suspicious === 'true') { query += ' AND al.is_suspicious = TRUE'; }

    query += ' ORDER BY al.created_at DESC LIMIT 500';
    const [rows] = await db.query(query, params);
    res.json({ success: true, activities: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name, u.employee_uid, u.email
       FROM alerts a
       JOIN users u ON a.triggered_by = u.id
       WHERE a.company_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.company_id]
    );
    res.json({ success: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resolveAlert = async (req, res) => {
  try {
    await db.query('UPDATE alerts SET is_resolved = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Alert resolved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const logPageVisit = async (req, res) => {
  try {
    const { page } = req.body;
    await db.query(
      'INSERT INTO activity_logs (user_id, action, resource, ip_address) VALUES (?, ?, ?, ?)',
      [req.user.id, 'PAGE_VISIT', page, req.ip]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMyActivity, getEmployeeActivity, getAlerts, resolveAlert, logPageVisit };