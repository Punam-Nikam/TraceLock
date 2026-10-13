const cron      = require('node-cron');
const taskModel = require('../models/taskModel');
const { sendDeadlineReminder } = require('./emailService');

const startCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running deadline reminder job...');
    try {
      const tasks = await taskModel.getUpcomingDeadlines();
      for (const task of tasks) {
        await sendDeadlineReminder(task.email, task.full_name, task.title, task.deadline);
      }
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });

  console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };