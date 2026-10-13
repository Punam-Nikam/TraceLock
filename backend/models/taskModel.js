const db = require('../config/db');

// ── CREATE TASK ──────────────────────────────────────────────────
const createTask = async (companyId, title, description, priority,
                          assignedTo, assignedBy, deadline, attachmentUrl, reviewerId) => {
  const [result] = await db.query(
    `INSERT INTO tasks
      (company_id, title, description, priority,
       assigned_to, assigned_by, deadline, attachment_url, reviewer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyId, title, description, priority,
     assignedTo, assignedBy, deadline || null,
     attachmentUrl || null, reviewerId || null]
  );
  return result.insertId;
};

// ── GET TASKS FOR EMPLOYEE ───────────────────────────────────────
const getTasksForEmployee = async (userId) => {
  const [rows] = await db.query(
    `SELECT t.*,
            ab.full_name  AS assigned_by_name,
            rv.full_name  AS reviewer_name,
            rv.email      AS reviewer_email,
            rb.full_name  AS reviewed_by_name,
            (SELECT tr.decision FROM task_reviews tr WHERE tr.task_id = t.id ORDER BY tr.reviewed_at DESC LIMIT 1) AS last_decision,
            (SELECT tr.feedback FROM task_reviews tr WHERE tr.task_id = t.id ORDER BY tr.reviewed_at DESC LIMIT 1) AS last_feedback
     FROM tasks t
     LEFT JOIN users ab ON t.assigned_by = ab.id
     LEFT JOIN users rv ON t.reviewer_id = rv.id
     LEFT JOIN users rb ON t.reviewed_by = rb.id
     WHERE t.assigned_to = ?
     ORDER BY
       FIELD(t.status, 'in_progress','todo','submitted','rejected','approved'),
       FIELD(t.priority,'high','medium','low'),
       t.deadline ASC`,
    [userId]
  );
  return rows;
};

// ── GET TASKS FOR REVIEWER ───────────────────────────────────────
const getTasksForReview = async (reviewerId) => {
  const [rows] = await db.query(
    `SELECT t.*,
            at2.full_name  AS assigned_to_name,
            at2.employee_uid,
            ab.full_name   AS assigned_by_name
     FROM tasks t
     LEFT JOIN users at2 ON t.assigned_to = at2.id
     LEFT JOIN users ab  ON t.assigned_by = ab.id
     WHERE t.reviewer_id = ?
       AND t.status = 'submitted'
     ORDER BY t.created_at DESC`,
    [reviewerId]
  );
  return rows;
};

// ── GET ALL TASKS FOR COMPANY ────────────────────────────────────
const getAllTasksForCompany = async (companyId, filters = {}) => {
  let query = `
    SELECT t.*,
           at2.full_name  AS assigned_to_name,
           at2.employee_uid,
           ab.full_name   AS assigned_by_name,
           rv.full_name   AS reviewer_name
    FROM tasks t
    LEFT JOIN users at2 ON t.assigned_to = at2.id
    LEFT JOIN users ab  ON t.assigned_by = ab.id
    LEFT JOIN users rv  ON t.reviewer_id = rv.id
    WHERE t.company_id = ?
  `;
  const params = [companyId];

  if (filters.status)     { query += ' AND t.status = ?';      params.push(filters.status); }
  if (filters.priority)   { query += ' AND t.priority = ?';    params.push(filters.priority); }
  if (filters.assignedTo) { query += ' AND t.assigned_to = ?'; params.push(filters.assignedTo); }

  query += ' ORDER BY t.created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

// ── UPDATE STATUS ────────────────────────────────────────────────
const updateStatus = async (taskId, status, userId) => {
  // Employees can only update tasks assigned to them
  const [result] = await db.query(
    'UPDATE tasks SET status = ? WHERE id = ? AND assigned_to = ?',
    [status, taskId, userId]
  );
  return result.affectedRows;
};

// ── SUBMIT TASK ──────────────────────────────────────────────────
// Employee submits work — goes to reviewer or directly to admin
const submitTask = async (taskId, submittedBy, note, fileUrl) => {
  await db.query(
    'UPDATE tasks SET status = ? WHERE id = ?',
    ['submitted', taskId]
  );
  const [result] = await db.query(
    `INSERT INTO task_submissions (task_id, submitted_by, submission_note, file_url)
     VALUES (?, ?, ?, ?)`,
    [taskId, submittedBy, note, fileUrl || null]
  );
  return result.insertId;
};

// ── REVIEW TASK ──────────────────────────────────────────────────
// Reviewer / Team Lead / Dept Head / Admin reviews submitted work
const reviewTask = async (taskId, reviewedBy, decision, feedback) => {
  const statusMap = {
    approved:          'approved',
    rejected:          'todo',          // back to todo so employee redoes it
    changes_requested: 'in_progress'    // back to in_progress for small changes
  };

  await db.query(
    'UPDATE tasks SET status = ?, reviewed_by = ? WHERE id = ?',
    [statusMap[decision], reviewedBy, taskId]
  );

  await db.query(
    `INSERT INTO task_reviews (task_id, reviewed_by, decision, feedback)
     VALUES (?, ?, ?, ?)`,
    [taskId, reviewedBy, decision, feedback || null]
  );
};

// ── GET TASK BY ID ───────────────────────────────────────────────
const getTaskById = async (taskId) => {
  const [rows] = await db.query(
    `SELECT t.*,
            at2.full_name  AS assigned_to_name,
            at2.email      AS assigned_to_email,
            at2.employee_uid,
            ab.full_name   AS assigned_by_name,
            rv.full_name   AS reviewer_name,
            rv.email       AS reviewer_email,
            rb.full_name   AS reviewed_by_name
     FROM tasks t
     LEFT JOIN users at2 ON t.assigned_to = at2.id
     LEFT JOIN users ab  ON t.assigned_by = ab.id
     LEFT JOIN users rv  ON t.reviewer_id = rv.id
     LEFT JOIN users rb  ON t.reviewed_by = rb.id
     WHERE t.id = ?`,
    [taskId]
  );
  return rows[0];
};

// ── GET SUBMISSIONS ──────────────────────────────────────────────
const getSubmissions = async (taskId) => {
  const [rows] = await db.query(
    `SELECT ts.*, u.full_name, u.employee_uid
     FROM task_submissions ts
     JOIN users u ON ts.submitted_by = u.id
     WHERE ts.task_id = ?
     ORDER BY ts.submitted_at DESC`,
    [taskId]
  );
  return rows;
};

// ── GET REVIEWS ──────────────────────────────────────────────────
const getReviews = async (taskId) => {
  const [rows] = await db.query(
    `SELECT tr.*, u.full_name AS reviewer_name, u.role AS reviewer_role
     FROM task_reviews tr
     JOIN users u ON tr.reviewed_by = u.id
     WHERE tr.task_id = ?
     ORDER BY tr.reviewed_at DESC`,
    [taskId]
  );
  return rows;
};

// ── TASK STATS ───────────────────────────────────────────────────
const getTaskStats = async (companyId) => {
  const [rows] = await db.query(
    `SELECT
       COUNT(*)                      AS total,
       SUM(status = 'todo')          AS todo,
       SUM(status = 'in_progress')   AS inProgress,
       SUM(status = 'submitted')     AS pendingReview,
       SUM(status = 'approved')      AS completed,
       SUM(status = 'rejected')      AS rejected
     FROM tasks WHERE company_id = ?`,
    [companyId]
  );
  return rows[0];
};

// ── UPCOMING DEADLINES (for cron job) ───────────────────────────
const getUpcomingDeadlines = async () => {
  const [rows] = await db.query(
    `SELECT t.*, u.email, u.full_name
     FROM tasks t
     JOIN users u ON t.assigned_to = u.id
     WHERE t.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
       AND t.status NOT IN ('approved','submitted')`,
    []
  );
  return rows;
};

module.exports = {
  createTask, getTasksForEmployee, getTasksForReview,
  getAllTasksForCompany, updateStatus, submitTask, reviewTask,
  getTaskById, getSubmissions, getReviews, getTaskStats, getUpcomingDeadlines
};