const taskModel = require('../models/taskModel');
const { logActivity, logAudit } = require('../utils/logger');
const db = require('../config/db');

// ── CREATE TASK ──────────────────────────────────────────────────
const createTask = async (req, res) => {
  const { title, description, priority, assignedTo, deadline, reviewerId } = req.body;

  if (!title || !assignedTo) {
    return res.status(400).json({ success: false, message: 'Title and assigned employee are required' });
  }

  try {
    let attachmentUrl = null;
    if (req.file) attachmentUrl = req.file.filename;

    const taskId = await taskModel.createTask(
      req.user.company_id, title, description, priority || 'medium',
      assignedTo, req.user.id, deadline, attachmentUrl,
      reviewerId || null
    );

    // Notify the assigned employee
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'task')`,
      [
        assignedTo,
        '📋 New Task Assigned',
        `You have been assigned a new task: "${title}"`
      ]
    );

    // Notify reviewer if assigned
    if (reviewerId && parseInt(reviewerId) !== parseInt(assignedTo)) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'task')`,
        [
          reviewerId,
          '👁 You are a Reviewer',
          `You have been assigned as reviewer for task: "${title}"`
        ]
      );
    }

    await logAudit(
      req.user.company_id, req.user.id, 'TASK_CREATED',
      `task:${taskId}`, null, { title, assignedTo, reviewerId }, req.ip
    );

    res.status(201).json({ success: true, message: 'Task created and assigned!', taskId });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MY TASKS (Employee) ──────────────────────────────────────
const getMyTasks = async (req, res) => {
  try {
    const tasks = await taskModel.getTasksForEmployee(req.user.id);
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET TASKS TO REVIEW (Reviewer) ──────────────────────────────
const getTasksToReview = async (req, res) => {
  try {
    const tasks = await taskModel.getTasksForReview(req.user.id);
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL TASKS (Admin/Manager) ────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskModel.getAllTasksForCompany(req.user.company_id, req.query);
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE STATUS ────────────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  try {
    const affected = await taskModel.updateStatus(req.params.id, req.body.status, req.user.id);
    if (!affected) {
      return res.status(403).json({ success: false, message: 'Cannot update this task' });
    }
    await logActivity(req.user.id, `TASK_STATUS_UPDATED:${req.body.status}`, `task:${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SUBMIT TASK ──────────────────────────────────────────────────
const submitTask = async (req, res) => {
  try {
    const { note } = req.body;
    const fileUrl  = req.file ? req.file.filename : null;

    await taskModel.submitTask(req.params.id, req.user.id, note, fileUrl);

    const task = await taskModel.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Determine who to notify
    // Priority: reviewer > dept_head/team_lead > assigner
    const notifyUsers = new Set();

    if (task.reviewer_id) {
      notifyUsers.add(task.reviewer_id);
    }
    notifyUsers.add(task.assigned_by);

    for (const uid of notifyUsers) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'task')`,
        [
          uid,
          '📤 Task Submitted for Review',
          `"${task.title}" has been submitted by ${req.user.full_name || 'employee'} and needs review.`
        ]
      );
    }

    await logActivity(req.user.id, 'TASK_SUBMITTED', `task:${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Work submitted successfully! Awaiting review.' });
  } catch (err) {
    console.error('submitTask error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REVIEW TASK ──────────────────────────────────────────────────
// Can be called by: reviewer, team_lead, dept_head, admin, super_admin
const reviewTask = async (req, res) => {
  const { decision, feedback } = req.body;

  if (!decision) {
    return res.status(400).json({ success: false, message: 'Decision is required' });
  }

  try {
    const task = await taskModel.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Check reviewer permission:
    // - Super admin / admin / dept_head / team_lead can review any task
    // - Regular employee can only review if they are the assigned reviewer
    const canReview = ['super_admin','admin','dept_head','team_lead'].includes(req.user.role)
                   || task.reviewer_id === req.user.id;

    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this task'
      });
    }

    await taskModel.reviewTask(req.params.id, req.user.id, decision, feedback);

    // Notify the employee
    const decisionMessages = {
      approved:          `✅ Great work! Your task "${task.title}" has been approved.`,
      rejected:          `❌ Your task "${task.title}" was rejected. Feedback: ${feedback || 'Please redo this task.'}`,
      changes_requested: `🔄 Changes requested for "${task.title}". Feedback: ${feedback || 'Please make the requested changes.'}`
    };

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'task')`,
      [
        task.assigned_to,
        '📋 Task Review Update',
        decisionMessages[decision] || `Task "${task.title}" has been reviewed.`
      ]
    );

    await logAudit(
      req.user.company_id, req.user.id,
      `TASK_${decision.toUpperCase()}`,
      `task:${req.params.id}`, null, { decision, feedback }, req.ip
    );

    res.json({ success: true, message: `Task ${decision.replace('_',' ')} successfully` });
  } catch (err) {
    console.error('reviewTask error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET TASK DETAIL ──────────────────────────────────────────────
const getTaskDetail = async (req, res) => {
  try {
    const task        = await taskModel.getTaskById(req.params.id);
    const submissions = await taskModel.getSubmissions(req.params.id);
    const reviews     = await taskModel.getReviews(req.params.id);
    res.json({ success: true, task, submissions, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET TASK STATS ───────────────────────────────────────────────
const getTaskStats = async (req, res) => {
  try {
    const stats = await taskModel.getTaskStats(req.user.company_id);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTask, getMyTasks, getTasksToReview, getAllTasks,
  updateTaskStatus, submitTask, reviewTask, getTaskDetail, getTaskStats
};