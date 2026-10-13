const db = require('../config/db');

const logActivity = async (userId, action, resource = null, ip = null, isSuspicious = false) => {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, resource, ip_address, is_suspicious)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, resource, ip, isSuspicious]
    );
  } catch (err) {
    console.error('Logger error:', err.message);
  }
};

const logAudit = async (companyId, userId, action, resource = null, oldVal = null, newVal = null, ip = null) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (company_id, user_id, action, resource, old_value, new_value, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId, userId, action, resource,
        oldVal ? JSON.stringify(oldVal) : null,
        newVal ? JSON.stringify(newVal) : null,
        ip
      ]
    );
  } catch (err) {
    console.error('Audit logger error:', err.message);
  }
};

module.exports = { logActivity, logAudit };