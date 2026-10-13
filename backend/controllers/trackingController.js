// Employee Tracking — Risk Score, Behavior Analysis, Location
const db = require('../config/db');

// Risk Score calculation based on behavior
const calculateRiskScore = async (userId) => {
  const now  = new Date();
  const week = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Factor 1: Bulk downloads (last 24h)
  const [[{ bulk }]] = await db.query(
    `SELECT COUNT(*) AS bulk FROM activity_logs
     WHERE user_id = ? AND action = 'FILE_DOWNLOADED'
     AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [userId]
  );

  // Factor 2: Off-hours activity
  const [[{ offHours }]] = await db.query(
    `SELECT COUNT(*) AS offHours FROM activity_logs
     WHERE user_id = ? AND created_at > ?
     AND (HOUR(created_at) < 7 OR HOUR(created_at) > 21)`,
    [userId, week]
  );

  // Factor 3: Suspicious flags
  const [[{ suspicious }]] = await db.query(
    `SELECT COUNT(*) AS suspicious FROM activity_logs
     WHERE user_id = ? AND is_suspicious = TRUE AND created_at > ?`,
    [userId, week]
  );

  // Factor 4: Failed logins (from audit)
  const [[{ failedLogins }]] = await db.query(
    `SELECT COUNT(*) AS failedLogins FROM audit_logs
     WHERE user_id = ? AND action LIKE '%FAILED%' AND created_at > ?`,
    [userId, week]
  );

  // Factor 5: Multiple IPs
  const [[{ ipCount }]] = await db.query(
    `SELECT COUNT(DISTINCT ip_address) AS ipCount
     FROM activity_logs WHERE user_id = ? AND created_at > ?`,
    [userId, week]
  );

  // Calculate score (0-100, higher = more risky)
  let score = 0;
  if (bulk >= 10)       score += 30;
  else if (bulk >= 5)   score += 15;
  else if (bulk >= 2)   score += 5;

  if (offHours >= 5)    score += 20;
  else if (offHours >= 2) score += 10;

  score += Math.min(suspicious * 15, 30);
  score += Math.min(failedLogins * 5, 10);

  if (ipCount >= 3)     score += 10;
  else if (ipCount >= 2) score += 5;

  return Math.min(score, 100);
};

// GET /api/tracking/employees — Admin sees all employee tracking
const getEmployeeTracking = async (req, res) => {
  try {
    const [employees] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.employee_uid, u.role,
              u.last_login, u.status,
              d.name AS department_name,
              COUNT(DISTINCT al.id) AS total_actions,
              SUM(al.is_suspicious) AS suspicious_actions,
              MAX(al.created_at)    AS last_active,
              COUNT(DISTINCT al.ip_address) AS unique_ips
       FROM users u
       LEFT JOIN activity_logs al ON u.id = al.user_id
         AND al.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.company_id = ? AND u.role != 'super_admin' AND u.status = 'active'
       GROUP BY u.id
       ORDER BY suspicious_actions DESC, total_actions DESC`,
      [req.user.company_id]
    );

    // Add risk scores
    const tracked = await Promise.all(employees.map(async (emp) => {
      const riskScore = await calculateRiskScore(emp.id);
      return {
        ...emp,
        riskScore,
        riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW'
      };
    }));

    res.json({ success:true, employees: tracked });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ success:false, message:err.message });
  }
};

// GET /api/tracking/employee/:id — Detailed tracking for one employee
const getEmployeeDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    // Recent activities
    const [activities] = await db.query(
      `SELECT action, resource, ip_address, is_suspicious, created_at
       FROM activity_logs WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    // Download history
    const [downloads] = await db.query(
      `SELECT fal.accessed_at, fal.ip_address, f.original_name, f.file_type
       FROM file_access_logs fal
       JOIN files f ON fal.file_id = f.id
       WHERE fal.user_id = ?
       ORDER BY fal.accessed_at DESC LIMIT 20`,
      [userId]
    );

    // Login history
    const [logins] = await db.query(
      `SELECT resource, ip_address, created_at FROM audit_logs
       WHERE user_id = ? AND action = 'USER_LOGIN'
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Activity by hour (heatmap data)
    const [hourlyData] = await db.query(
      `SELECT HOUR(created_at) AS hour, COUNT(*) AS count
       FROM activity_logs WHERE user_id = ?
         AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      [userId]
    );

    // Activity by day (last 30 days)
    const [dailyData] = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count,
              SUM(is_suspicious) AS suspicious
       FROM activity_logs WHERE user_id = ?
         AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );

    const riskScore = await calculateRiskScore(userId);

    res.json({
      success: true,
      riskScore,
      riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
      activities,
      downloads,
      logins,
      hourlyData,
      dailyData
    });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

// GET /api/tracking/dashboard — Overall security dashboard
const getTrackingDashboard = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // Most active users today
    const [topUsers] = await db.query(
      `SELECT u.full_name, u.employee_uid, COUNT(al.id) AS actions
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE u.company_id = ? AND DATE(al.created_at) = CURDATE()
       GROUP BY u.id ORDER BY actions DESC LIMIT 5`,
      [companyId]
    );

    // Recent suspicious activities
    const [suspicious] = await db.query(
      `SELECT al.action, al.ip_address, al.created_at,
              u.full_name, u.employee_uid
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE u.company_id = ? AND al.is_suspicious = TRUE
       ORDER BY al.created_at DESC LIMIT 10`,
      [companyId]
    );

    // File downloads last 7 days
    const [dlTrend] = await db.query(
      `SELECT DATE(fal.accessed_at) AS date, COUNT(*) AS count
       FROM file_access_logs fal
       JOIN files f ON fal.file_id = f.id
       WHERE f.company_id = ?
         AND fal.accessed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(fal.accessed_at) ORDER BY date`,
      [companyId]
    );

    // High risk employees
    const [allEmps] = await db.query(
      `SELECT id, full_name, employee_uid FROM users
       WHERE company_id = ? AND status = 'active' AND role != 'super_admin'`,
      [companyId]
    );

    const highRisk = [];
    for (const emp of allEmps) {
      const score = await calculateRiskScore(emp.id);
      if (score >= 40) {
        highRisk.push({ ...emp, riskScore: score });
      }
    }
    highRisk.sort((a,b) => b.riskScore - a.riskScore);

    res.json({
      success: true,
      topUsers,
      suspicious,
      dlTrend,
      highRisk: highRisk.slice(0,5)
    });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

module.exports = { getEmployeeTracking, getEmployeeDetail, getTrackingDashboard };