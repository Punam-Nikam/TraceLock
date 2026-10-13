const fs        = require('fs');
const path      = require('path');
const fileModel = require('../models/fileModel');
const { encrypt, decrypt, encryptBuffer, decryptBuffer } = require('../utils/encryption');
const {
  addWatermarkToPDF,
  addWatermarkToImage,
  extractWatermarkFromPDF
} = require('../utils/watermark');
const { logActivity, logAudit } = require('../utils/logger');
const db = require('../config/db');

// ── UPLOAD FILE ──────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { permission, expiresAt, shareWithUsers } = req.body;
  const userIds = shareWithUsers ? JSON.parse(shareWithUsers) : [];

  try {
    const filePath   = path.join('uploads', req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);

    // Encrypt the file before storing
    const encryptedBuf = encryptBuffer(fileBuffer);
    fs.writeFileSync(filePath, encryptedBuf);

    const ext    = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileId = await fileModel.createFile(
      req.user.company_id,
      req.user.id,
      req.file.originalname,
      req.file.filename,
      ext,
      req.file.size,
      permission || 'download',
      expiresAt  || null
    );

    if (userIds.length > 0) {
      await fileModel.shareFileWithUsers(fileId, userIds, req.user.id);
    }

    await logAudit(
      req.user.company_id, req.user.id, 'FILE_UPLOADED',
      `file:${fileId}`, null, { name: req.file.originalname, sharedWith: userIds.length }, req.ip
    );

    res.status(201).json({
      success: true,
      message: `File uploaded and encrypted. Shared with ${userIds.length} employee(s).`,
      fileId
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MY FILES (Employee) ──────────────────────────────────────
const getMyFiles = async (req, res) => {
  try {
    const files = await fileModel.getFilesForUser(req.user.id, req.user.company_id);
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL FILES (Admin) ────────────────────────────────────────
const getAllFiles = async (req, res) => {
  try {
    const files = await fileModel.getAllFilesForCompany(req.user.company_id);
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DOWNLOAD FILE (with watermark) ──────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const file = await fileModel.getFileById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check expiry
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return res.status(403).json({ success: false, message: 'This file has expired' });
    }

    // Check access (employees need to be in file_shares)
    if (!['super_admin', 'admin', 'dept_head'].includes(req.user.role)) {
      const access = await fileModel.checkUserAccess(file.id, req.user.id);
      if (!access) {
        return res.status(403).json({ success: false, message: 'You do not have access to this file' });
      }
    }

    // Check permission
    if (file.permission !== 'download') {
      return res.status(403).json({ success: false, message: 'This file is view-only. Download is not allowed.' });
    }

    const filePath = path.join('uploads', file.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Read and decrypt the file
    const encryptedBuffer = fs.readFileSync(filePath);
    let   decryptedBuffer;

    try {
      decryptedBuffer = decryptBuffer(encryptedBuffer);
    } catch (decryptErr) {
      console.error('Decrypt error — treating as unencrypted:', decryptErr.message);
      decryptedBuffer = encryptedBuffer;
    }

    // Generate watermark text = encrypted employee UID
    const employeeUID    = req.user.employee_uid || String(req.user.id);
    const watermarkText  = encrypt(employeeUID);

    console.log(`📍 Watermarking file for employee: ${employeeUID}`);
    console.log(`📍 Encrypted watermark: ${watermarkText.substring(0,20)}...`);

    // Add watermark based on file type
    let finalBuffer;
    const ext = path.extname(file.original_name).toLowerCase();

    if (ext === '.pdf') {
      console.log('📄 Adding PDF watermark...');
      finalBuffer = await addWatermarkToPDF(decryptedBuffer, watermarkText, employeeUID);
      console.log('✅ PDF watermark added');
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      console.log('🖼️ Adding image watermark...');
      finalBuffer = await addWatermarkToImage(decryptedBuffer, watermarkText, employeeUID);
      console.log('✅ Image watermark added');
    } else {
      // For other files — send decrypted without visual watermark
      finalBuffer = decryptedBuffer;
    }

    // Log the download with watermark ID
    await fileModel.logFileAccess(file.id, req.user.id, 'download', req.ip, watermarkText);
    await logActivity(req.user.id, 'FILE_DOWNLOADED', `file:${file.id}:${file.original_name}`, req.ip);

    // Send file
    const mimeTypes = {
      '.pdf':  'application/pdf',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt':  'text/plain',
    };

    const mime = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Length', finalBuffer.length);
    res.send(finalBuffer);

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DETECT LEAK ──────────────────────────────────────────────────
const detectLeak = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploadedPath = path.join('uploads', req.file.filename);

  try {
    const uploadedBuffer = fs.readFileSync(uploadedPath);
    const ext            = path.extname(req.file.originalname).toLowerCase();
    let   extractedWm    = null;

    if (ext === '.pdf') {
      extractedWm = await extractWatermarkFromPDF(uploadedBuffer);
    }

    // Clean up temp upload
    if (fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }

    if (!extractedWm) {
      return res.status(404).json({
        success: false,
        message: 'No TraceLock watermark found in this file. It may not have been downloaded from your TraceLock system, or the watermark was removed.'
      });
    }

    // Decrypt the watermark to get the employee UID
    let employeeUID;
    try {
      employeeUID = decrypt(extractedWm);
    } catch (decErr) {
      return res.status(400).json({
        success: false,
        message: 'Found a watermark but could not decrypt it. Encryption keys may have changed.'
      });
    }

    // Find who downloaded it
    const [accessLogs] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.employee_uid,
              fal.accessed_at, fal.ip_address, fal.file_id,
              f.original_name AS file_name
       FROM file_access_logs fal
       JOIN users u ON fal.user_id = u.id
       JOIN files f ON fal.file_id = f.id
       WHERE fal.watermark_id = ?
       ORDER BY fal.accessed_at DESC`,
      [extractedWm]
    );

    // Also try to find user by UID directly
    const [userRows] = await db.query(
      'SELECT id, full_name, email, employee_uid FROM users WHERE employee_uid = ?',
      [employeeUID]
    );

    await logAudit(
      req.user.company_id, req.user.id, 'LEAK_DETECTION_SCAN',
      `watermark:${extractedWm.substring(0,20)}`, null,
      { employeeUID, found: accessLogs.length > 0 }, req.ip
    );

    res.json({
      success:     true,
      employeeUID,
      foundUser:   userRows[0] || null,
      accessLogs,
      message:     `Watermark successfully decoded! Employee UID: ${employeeUID}`
    });

  } catch (err) {
    console.error('Detect leak error:', err);
    if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET FILE LOGS ────────────────────────────────────────────────
const getFileLogs = async (req, res) => {
  try {
    const logs = await fileModel.getFileAccessLogs(req.params.id);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadFile, getMyFiles, getAllFiles,
  downloadFile, detectLeak, getFileLogs
};