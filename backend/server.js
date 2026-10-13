const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
require('dotenv').config();

const authRoutes         = require('./routes/authRoutes');
const approvalRoutes     = require('./routes/approvalRoutes');
const employeeRoutes     = require('./routes/employeeRoutes');
const fileRoutes         = require('./routes/fileRoutes');
const taskRoutes         = require('./routes/taskRoutes');
const activityRoutes     = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes        = require('./routes/auditRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const { startCronJobs }  = require('./utils/cronJobs');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',          authRoutes);
app.use('/api/approval',      approvalRoutes);
app.use('/api/employees',     employeeRoutes);
app.use('/api/files',         fileRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/activity',      activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit',         auditRoutes);
app.use('/api/dashboard',     dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'TraceLock running' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('🔴', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TraceLock running on http://localhost:${PORT}`);
  startCronJobs();
});