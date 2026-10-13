const db = require('../config/db');

const getActivityByUser = async (userId, from, to, suspicious) => {
  let query  = 'SELECT * FROM activity_logs WHERE user_id = ?';
  const params = [userId];

  if (from)                { query += ' AND created_at >= ?';     params.push(from); }
  if (to)                  { query += ' AND created_at <= ?';     params.push(to); }
  if (suspicious === 'true') { query += ' AND is_suspicious = TRUE'; }

  query += ' ORDER BY created_at DESC LIMIT 500';
  const [rows] = await db.query(query, params);
  return rows;
};

const getRecentActivity = async (userId, limit = 100) => {
  const [rows] = await db.query(
    'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows;
};

module.exports = { getActivityByUser, getRecentActivity };