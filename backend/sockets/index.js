const io = require('../sockets');
const Message = require('../models/message.model');
const Notification = require('../models/notification.model');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');
const answerController = require('../controllers/answer.controller');
const questionController = require('../controllers/question.controller');

// Handle user connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for joining a chat room
  socket.on('join_chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined chat: ${conversationId}`);
  });

  // Handle sending a message
  socket.on('send_message', async ({ sender, receiver, content }) => {
    try {
      if (!receiver || !content.trim()) return;

      const message = new Message({ sender, receiver, content });
      await message.save();

      io.to(receiver).emit('new_message', message);
      io.to(sender).emit('message_sent', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle notifications
  socket.on('send_notification', async ({ userId, type, data }) => {
    try {
      const notification = new Notification({ userId, type, data });
      await notification.save();

      io.to(userId).emit('new_notification', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Define API routes
// Question Routes
// router.post('/questions', authenticate, questionController.createQuestion);
// router.get('/questions', questionController.getQuestions);
// router.get('/questions/:id', questionController.getQuestionById);
// router.put('/questions/:id', authenticate, questionController.updateQuestion);
// router.delete('/questions/:id', authenticate, questionController.deleteQuestion);
// router.post('/questions/:id/vote', authenticate, questionController.voteQuestion);
// router.post('/questions/:id/close', authenticate, questionController.closeQuestion);
// router.post('/questions/:id/reopen', authenticate, questionController.reopenQuestion);
// router.get('/questions/tag/:tag', questionController.getQuestionsByTag);
// router.get('/questions/trending', questionController.getTrendingQuestions);

// Answer Routes
// router.post('/answers', authenticate, answerController.createAnswer);
// router.get('/answers/:questionId', answerController.getAnswersByQuestion);
// router.post('/answers/:id/vote', authenticate, answerController.voteAnswer);

// Message Routes
// router.post('/messages', authenticate, messageController.sendMessage);
// router.get('/messages/:withUser', authenticate, messageController.getMessages);
// router.put('/messages/:messageId/read', authenticate, messageController.markAsRead);
// router.delete('/messages/:messageId', authenticate, messageController.deleteMessage);

// Security Configurations
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Monitoring and Logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// CI/CD Pipeline Setup (Docker, Testing, Deployment)
const { exec } = require('child_process');
app.get('/deploy', (req, res) => {
  exec('sh ./deploy.sh', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ message: 'Deployment failed', error: stderr });
    }
    res.status(200).json({ message: 'Deployment triggered successfully', output: stdout });
  });
});

// // Backup and Recovery Strategy
// const schedule = require('node-schedule');
// const { backupDatabase } = require('../services/backup.service');

// schedule.scheduleJob('0 0 * * *', async () => {
//   await backupDatabase();
//   console.log('Database backup completed');
// });

module.exports = router;