const User = require('../models/user.model');
const Question = require('../models/question.model');
const Answer = require('../models/answer.model');
const cacheService = require('../services/cache.service');
const mongoose = require('mongoose');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.userId;
    
    // Try to get from cache first
    const cacheKey = `user:${userId}`;
    const cachedUser = await cacheService.get(cacheKey);
    
    if (cachedUser) {
      return res.status(200).json({ user: cachedUser });
    }
    
    // Get from database if not in cache
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user profile (excludes sensitive data)
    const userProfile = user.getProfile();
    
    // Cache user profile for 1 hour
    await cacheService.set(cacheKey, userProfile, 3600);
    
    res.status(200).json({ user: userProfile });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    // Fields that cannot be updated
    const forbiddenUpdates = ['password', 'role', 'email', 'isVerified', 'isBanned', 'refreshTokens'];
    
    // Remove forbidden fields from updates
    forbiddenUpdates.forEach(field => delete updates[field]);
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update cache
    const cacheKey = `user:${userId}`;
    await cacheService.set(cacheKey, user.getProfile(), 3600);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.getProfile()
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.userId;
    
    // Try to get from cache first
    const cacheKey = `user:${userId}:stats`;
    const cachedStats = await cacheService.get(cacheKey);
    
    if (cachedStats) {
      return res.status(200).json(cachedStats);
    }
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get statistics
    const [questions, answers, acceptedAnswers, topQuestions, recentActivity] = await Promise.all([
      Question.countDocuments({ author: userId }),
      Answer.countDocuments({ author: userId }),
      Answer.countDocuments({ author: userId, isAccepted: true }),
      Question.find({ author: userId })
        .sort({ voteCount: -1, views: -1 })
        .limit(5)
        .select('title views voteCount createdAt'),
      Promise.all([
        Question.find({ author: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title createdAt')
          .lean()
          .then(questions => questions.map(q => ({ ...q, type: 'question' }))),
        Answer.find({ author: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('content createdAt question')
          .populate('question', 'title')
          .lean()
          .then(answers => answers.map(a => ({ ...a, type: 'answer' })))
      ]).then(([recentQuestions, recentAnswers]) => 
        [...recentQuestions, ...recentAnswers]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5)
      )
    ]);
    
    // Calculate reputation breakdown
    const reputationBreakdown = {
      questionsReputation: Math.floor(questions * 5),
      answersReputation: Math.floor(answers * 10),
      acceptedAnswersReputation: Math.floor(acceptedAnswers * 15)
    };
    
    const stats = {
      questionsCount: questions,
      answersCount: answers,
      acceptedAnswersCount: acceptedAnswers,
      reputation: user.reputation,
      reputationBreakdown,
      topQuestions,
      recentActivity
    };
    
    // Cache stats for 1 hour
    await cacheService.set(cacheKey, stats, 3600);
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    
    // Clear all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -verificationToken -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// Ban/unban user (admin only)
exports.toggleBanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Toggle ban status
    user.isBanned = !user.isBanned;
    
    // Add ban reason if banning
    if (user.isBanned) {
      user.banReason = reason || 'Violation of terms of service';
    } else {
      user.banReason = undefined;
    }
    
    await user.save();
    
    // Clear cache
    await cacheService.delete(`user:${userId}`);
    
    res.status(200).json({
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      isBanned: user.isBanned
    });
  } catch (error) {
    next(error);
  }
};

// Export users data (admin only)
exports.exportUsers = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get all users
    const users = await User.find({})
      .select('username email fullName role institution createdAt lastLogin questionsCount answersCount reputation isVerified isBanned')
      .sort({ createdAt: -1 });
    
    if (format === 'json') {
      return res.status(200).json({ users });
    }
    
    // CSV export
    const csvFilePath = path.join(__dirname, '../temp', `users_export_${Date.now()}.csv`);
    
    // Ensure temp directory exists
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    }
    
    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'username', title: 'Username' },
        { id: 'email', title: 'Email' },
        { id: 'fullName', title: 'Full Name' },
        { id: 'role', title: 'Role' },
        { id: 'institution', title: 'Institution' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'lastLogin', title: 'Last Login' },
        { id: 'questionsCount', title: 'Questions Count' },
        { id: 'answersCount', title: 'Answers Count' },
        { id: 'reputation', title: 'Reputation' },
        { id: 'isVerified', title: 'Verified' },
        { id: 'isBanned', title: 'Banned' }
      ]
    });
    
    // Format data
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      createdAt: user.createdAt ? user.createdAt.toISOString() : '',
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : ''
    }));
    
    // Write to CSV
    await csvWriter.writeRecords(formattedUsers);
    
    // Send file
    res.download(csvFilePath, 'users_export.csv', (err) => {
      if (err) {
        next(err);
      }
      
      // Delete file after sending
      fs.unlink(csvFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temp file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
