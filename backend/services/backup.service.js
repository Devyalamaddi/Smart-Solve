// Backup and Recovery Strategy
const schedule = require('node-schedule');
const { backupDatabase } = require('../services/backup.service');

schedule.scheduleJob('0 0 * * *', async () => {
  await backupDatabase();
  console.log('Database backup completed');
});
