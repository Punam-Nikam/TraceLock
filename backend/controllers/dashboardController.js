const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  const { company_id, id: userId, role } = req.user;
  try {
    let data = {};

    if (['super_admin','admin','dept_head'].includes(role)) {
      const [[{ totalEmployees }]] = await db.query(
        `SELECT COUNT(*) AS totalEmployees FROM users
         WHERE company_id = ? AND status = 'active' AND role != 'super_admin'`,
        [company_id]
      );
      const [[{ pendingCount }]] = await db.query(
        `SELECT COUNT(*) AS pendingCount FROM users
         WHERE company_id = ? AND status = 'pending'`,
        [company_id]
      );
      const [[taskStats]] = await db.query(
        `SELECT
           SUM(status='todo')        AS todo,
           SUM(status='in_progress') AS inProgress,
           SUM(status='submitted')   AS pendingReview,
           SUM(status='approved')    AS completed,
           COUNT(*)                  AS total
         FROM tasks WHERE company_id = ?`,
        [company_id]
      );
      const [[{ filesShared }]] = await db.query(
        `SELECT COUNT(*) AS filesShared FROM files
         WHERE company_id = ? AND MONTH(created_at) = MONTH(NOW())`,
        [company_id]
      );
      const [[{ openAlerts }]] = await db.query(
        `SELECT COUNT(*) AS openAlerts FROM alerts
         WHERE company_id = ? AND is_resolved = FALSE`,
        [company_id]
      );
      const [downloadTrend] = await db.query(
        `SELECT DATE(accessed_at) AS date, COUNT(*) AS count
         FROM file_access_logs fal
         JOIN files f ON fal.file_id = f.id
         WHERE f.company_id = ? AND accessed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(accessed_at) ORDER BY date ASC`,
        [company_id]
      );
      const [deptStats] = await db.query(
        `SELECT d.name AS department,
                COUNT(t.id) AS total,
                SUM(t.status='approved') AS completed
         FROM tasks t
         JOIN users u  ON t.assigned_to = u.id
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE t.company_id = ? GROUP BY d.name`,
        [company_id]
      );

      data = {
        totalEmployees, pendingCount, taskStats,
        filesShared, openAlerts, downloadTrend, deptStats
      };

    } else {
      const [[myTasks]] = await db.query(
        `SELECT
           SUM(status='todo')        AS todo,
           SUM(status='in_progress') AS inProgress,
           SUM(status='approved')    AS completed,
           COUNT(*)                  AS total
         FROM tasks WHERE assigned_to = ?`,
        [userId]
      );
      const [deadlines] = await db.query(
        `SELECT id, title, deadline, priority FROM tasks
         WHERE assigned_to = ? AND deadline > NOW()
           AND status NOT IN ('approved')
         ORDER BY deadline ASC LIMIT 5`,
        [userId]
      );
      const [recentFiles] = await db.query(
        `SELECT f.original_name, fal.accessed_at
         FROM file_access_logs fal
         JOIN files f ON fal.file_id = f.id
         WHERE fal.user_id = ?
         ORDER BY fal.accessed_at DESC LIMIT 5`,
        [userId]
      );

      data = { myTasks, deadlines, recentFiles };
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats };