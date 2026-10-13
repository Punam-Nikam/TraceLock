const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (toEmail, fullName, password, role) => {
  try {
    await transporter.sendMail({
      from:    `"TraceLock System" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: '🔐 Your TraceLock Account is Ready',
      html: `
        <h2>Welcome to TraceLock, ${fullName}!</h2>
        <p>Your account has been created.</p>
        <table>
          <tr><td><b>Email:</b></td><td>${toEmail}</td></tr>
          <tr><td><b>Password:</b></td><td>${password}</td></tr>
          <tr><td><b>Role:</b></td><td>${role}</td></tr>
        </table>
        <p style="color:red;">Please change your password after first login.</p>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

const sendApprovalEmail = async (toEmail, fullName, role, departmentName) => {
  try {
    await transporter.sendMail({
      from:    `"TraceLock" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: '✅ Your TraceLock Account is Approved!',
      html: `
        <h2>Account Approved, ${fullName}!</h2>
        <p>Your TraceLock account has been approved by your admin.</p>
        <p><b>Role:</b> ${role}</p>
        <p><b>Department:</b> ${departmentName || 'Not assigned yet'}</p>
        <p>You can now login at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

const sendSuspiciousActivityAlert = async (adminEmail, employeeName, action, ip) => {
  try {
    await transporter.sendMail({
      from:    `"TraceLock Alert" <${process.env.EMAIL_USER}>`,
      to:      adminEmail,
      subject: '⚠️ Suspicious Activity Detected — TraceLock',
      html: `
        <h2>⚠️ Suspicious Activity Alert</h2>
        <p><b>Employee:</b> ${employeeName}</p>
        <p><b>Action:</b> ${action}</p>
        <p><b>IP Address:</b> ${ip}</p>
        <p><b>Time:</b> ${new Date().toLocaleString()}</p>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

const sendDeadlineReminder = async (toEmail, fullName, taskTitle, deadline) => {
  try {
    await transporter.sendMail({
      from:    `"TraceLock" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: `⏰ Task Deadline Tomorrow — ${taskTitle}`,
      html: `
        <h2>Deadline Reminder</h2>
        <p>Hi ${fullName},</p>
        <p>Your task <b>"${taskTitle}"</b> is due on <b>${new Date(deadline).toLocaleString()}</b>.</p>
        <p>Please submit before the deadline.</p>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

module.exports = {
  sendWelcomeEmail, sendApprovalEmail,
  sendSuspiciousActivityAlert, sendDeadlineReminder
};