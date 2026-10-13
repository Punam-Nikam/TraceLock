const db = require('../config/db');

const createFile = async (companyId, uploadedBy, originalName, storedName, fileType, fileSize, permission, expiresAt) => {
  const [result] = await db.query(
    `INSERT INTO files (company_id, uploaded_by, original_name, stored_name, file_type, file_size, permission, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyId, uploadedBy, originalName, storedName, fileType, fileSize, permission, expiresAt || null]
  );
  return result.insertId;
};

const shareFileWithUsers = async (fileId, userIds, sharedBy) => {
  if (!userIds || userIds.length === 0) return;
  const values = userIds.map(uid => [fileId, uid, sharedBy]);
  await db.query('INSERT INTO file_shares (file_id, user_id, shared_by) VALUES ?', [values]);
};

const getFilesForUser = async (userId, companyId) => {
  const [rows] = await db.query(
    `SELECT f.id, f.original_name, f.file_type, f.file_size,
            f.permission, f.expires_at, f.created_at,
            u.full_name AS uploaded_by_name
     FROM file_shares fs
     JOIN files f ON fs.file_id = f.id
     JOIN users u ON f.uploaded_by = u.id
     WHERE fs.user_id = ?
       AND f.company_id = ?
       AND f.is_active = TRUE
       AND (f.expires_at IS NULL OR f.expires_at > NOW())
     ORDER BY f.created_at DESC`,
    [userId, companyId]
  );
  return rows;
};

const getAllFilesForCompany = async (companyId) => {
  const [rows] = await db.query(
    `SELECT f.*, u.full_name AS uploader_name,
            COUNT(fs.id) AS share_count
     FROM files f
     JOIN users u ON f.uploaded_by = u.id
     LEFT JOIN file_shares fs ON f.id = fs.file_id
     WHERE f.company_id = ?
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    [companyId]
  );
  return rows;
};

const getFileById = async (fileId) => {
  const [rows] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
  return rows[0];
};

const checkUserAccess = async (fileId, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM file_shares WHERE file_id = ? AND user_id = ?',
    [fileId, userId]
  );
  return rows[0];
};

const logFileAccess = async (fileId, userId, action, ip, watermarkId) => {
  await db.query(
    `INSERT INTO file_access_logs (file_id, user_id, action, ip_address, watermark_id)
     VALUES (?, ?, ?, ?, ?)`,
    [fileId, userId, action, ip, watermarkId]
  );
};

const getFileAccessLogs = async (fileId) => {
  const [rows] = await db.query(
    `SELECT fal.*, u.full_name, u.employee_uid, u.email
     FROM file_access_logs fal
     JOIN users u ON fal.user_id = u.id
     WHERE fal.file_id = ?
     ORDER BY fal.accessed_at DESC`,
    [fileId]
  );
  return rows;
};

module.exports = {
  createFile, shareFileWithUsers, getFilesForUser,
  getAllFilesForCompany, getFileById, checkUserAccess,
  logFileAccess, getFileAccessLogs
};