const Question = require('../models/question.model');
const User = require('../models/user.model');
const Answer = require('../models/answer.model');
const cacheService = require('../services/cache.service');
const { uploadToS3, deleteFromS3 } = require('../services/storage.service');
const { sendNotification } = require('../services/notification.service');
const mongoose = require('mongoose');

// Create a new question
exports.createQuestion = async (req, res, next) => {
  try {
    const { title, content, tags, subject, difficulty, isPrivate } = req.body;
    const userId = req.user.userId;
    
    // Create new question
    const newQuestion = new Question({
      title,
      content,
      author: userId,
      tags: tags || [],
      subject,
      difficulty: difficulty || 'intermediate',
      isPrivate: isPrivate || false
    });
    
    // Handle attachments if any
    if (req.files && req.files.length > 0) {
      const attachments = [];
      
      for (const file of req.files) {
        // Upload to S3
        const uploadResult = await uploadToS3(file);
        
        attachments.push({
          url: uploadResult.Location,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      }
      
      newQuestion.attachments = attachments;
    }
    
    // Save question
    await newQuestion.save();
    
    // Update user's question count
    await User.findByIdAndUpdate(userId, { $inc: { questionsCount: 1 } });
    
    // Clear cache for questions list
    await cacheService.clearByPattern('questions:list:*');
    
    // Send notification to subscribers of the subject
    await sendNotification('new_question', {
      questionId: newQuestion._id,
      title: newQuestion.title,
      subject: newQuestion.subject,
      authorId: userId
    });
    
    res.status(201).json({
      message: 'Question created successfully',
      question: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

// Get all questions with filtering, sorting, and pagination
exports.getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'newest',
      subject,
      difficulty,
      tag,
      search,
      author
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Only show non-private questions unless requesting own questions
    if (req.user && req.user.userId === author) {
      // Show all questions by this author, private or not
      filter.author = mongoose.Types.ObjectId(author);
    } else {
      filter.isPrivate = false;
      
      // If author is specified, only show their public questions
      if (author) {
        filter.author = mongoose.Types.ObjectId(author);
      }
    }
    
    // Apply other filters
    if (subject) {
      filter.subject = subject;
    }
    
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    
    if (tag) {
      filter.tags = tag;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Determine sort order
    let sortOption = {};
    
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'most_votes':
        sortOption = { voteCount: -1 };
        break;
      case 'most_views':
        sortOption = { views: -1 };
        break;
      case 'most_answers':
        sortOption = { answersCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Check cache first
    const cacheKey = `questions:list:${JSON.stringify({ page, limit, sort, filter })}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Run query with pagination
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('author', 'username fullName profilePicture reputation')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments(filter)
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // Prepare response
    const result = {
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
    
    // Cache result for 5 minutes
    await cacheService.set(cacheKey, result, 300);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get a single question by ID
exports.getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check cache first
    const cacheKey = `question:${id}`;
    const cachedQuestion = await cacheService.get(cacheKey);
    
    if (cachedQuestion) {
      // If question is private, check if user is the author
      if (cachedQuestion.isPrivate) {
        if (!req.user || req.user.userId !== cachedQuestion.author._id.toString()) {
          return res.status(403).json({ message: 'You do not have permission to view this question' });
        }
      }
      
      // Increment view count in the background
      Question.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
      
      return res.status(200).json({ question: cachedQuestion });
    }
    
    // Get question from database
    const question = await Question.findById(id)
      .populate('author', 'username fullName profilePicture reputation')
      .populate('acceptedAnswer');
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // If question is private, check if user is the author
    if (question.isPrivate) {
      if (!req.user || req.user.userId !== question.author._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to view this question' });
      }
    }
    
    // Increment view count
    question.views += 1;
    await question.save();
    
    // Cache question for 15 minutes
    await cacheService.set(cacheKey, question.toObject(), 900);
    
    res.status(200).json({ question });
  } catch (error) {
    next(error);
  }
};

// Update a question
exports.updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, tags, subject, difficulty, isPrivate } = req.body;
    const userId = req.user.userId;
    
    // Find question
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is the author or an admin
    if (question.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to update this question' });
    }
    
    // Update fields
    if (title) question.title = title;
    if (content) question.content = content;
    if (tags) question.tags = tags;
    if (subject) question.subject = subject;
    if (difficulty) question.difficulty = difficulty;
    if (isPrivate !== undefined) question.isPrivate = isPrivate;
    
    // Handle attachments if any
    if (req.files && req.files.length > 0) {
      const newAttachments = [];
      
      // Delete old attachments from S3
      for (const attachment of question.attachments) {
        await deleteFromS3(attachment.url);
      }
      
      // Upload new attachments
      for (const file of req.files) {
        const uploadResult = await uploadToS3(file);
        
        newAttachments.push({
          url: uploadResult.Location,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      }
      
      question.attachments = newAttachments;
    }
    
    // Save updated question
    await question.save();
    
    // Clear cache
    await cacheService.delete(`question:${id}`);
    await cacheService.clearByPattern('questions:list:*');
    
    res.status(200).json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};

// Delete a question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Find question
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is the author or an admin
    if (question.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this question' });
    }
    
    // Delete attachments from S3
    for (const attachment of question.attachments) {
      await deleteFromS3(attachment.url);
    }
    
    // Delete all answers to this question
    const answers = await Answer.find({ question: id });
    
    // Delete answer attachments
    for (const answer of answers) {
      for (const attachment of answer.attachments) {
        await deleteFromS3(attachment.url);
      }
    }
    
    // Delete answers
    await Answer.deleteMany({ question: id });
    
    // Delete question
    await Question.findByIdAndDelete(id);
    
    // Update user's question count
    await User.findByIdAndUpdate(question.author, { $inc: { questionsCount: -1 } });
    
    // Clear cache
    await cacheService.delete(`question:${id}`);
    await cacheService.clearByPattern('questions:list:*');
    
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Vote on a question
exports.voteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user.userId;
    
    // Find question
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user has already voted
    const hasUpvoted = question.upvotes.some(vote => vote.user.toString() === userId);
    const hasDownvoted = question.downvotes.some(vote => vote.user.toString() === userId);
    
    // Handle vote
    if (voteType === 'up') {
      if (hasUpvoted) {
        // Remove upvote
        question.upvotes = question.upvotes.filter(vote => vote.user.toString() !== userId);
      } else {
        // Add upvote
        question.upvotes.push({ user: userId });
        
        // Remove downvote if exists
        if (hasDownvoted) {
          question.downvotes = question.downvotes.filter(vote => vote.user.toString() !== userId);
        }
        
        // Award reputation to question author (if not self-voting)
        if (question.author.toString() !== userId) {
          await User.findByIdAndUpdate(question.author, { $inc: { reputation: 5 } });
        }
      }
    } else if (voteType === 'down') {
      if (hasDownvoted) {
        // Remove downvote
        question.downvotes = question.downvotes.filter(vote => vote.user.toString() !== userId);
      } else {
        // Add downvote
        question.downvotes.push({ user: userId });
        
        // Remove upvote if exists
        if (hasUpvoted) {
          question.upvotes = question.upvotes.filter(vote => vote.user.toString() !== userId);
        }
        
        // Reduce reputation of question author (if not self-voting)
        if (question.author.toString() !== userId) {
          await User.findByIdAndUpdate(question.author, { $inc: { reputation: -2 } });
        }
      }
    }
    
    // Save question
    await question.save();
    
    // Clear cache
    await cacheService.delete(`question:${id}`);
    
    res.status(200).json({
      message: 'Vote registered successfully',
      voteCount: question.upvotes.length - question.downvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// Close a question
exports.closeQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    
    // Find question
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is the author or an admin
    if (question.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to close this question' });
    }
    
    // Close question
    question.isClosed = true;
    question.closedReason = reason || 'resolved';
    question.closedAt = new Date();
    
    await question.save();
    
    // Clear cache
    await cacheService.delete(`question:${id}`);
    
    res.status(200).json({
      message: 'Question closed successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};

// Complete reopenQuestion function
exports.reopenQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Find question
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is the author or an admin
    if (question.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to reopen this question' });
    }
    
    // Reopen question
    question.isClosed = false;
    question.closedReason = null;
    question.closedAt = null;
    
    await question.save();
    
    // Clear cache
    await cacheService.delete(`question:${id}`);
    
    res.status(200).json({
      message: 'Question reopened successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

// Implement feature to get questions by tag
exports.getQuestionsByTag = async (req, res, next) => {
  try {
    const { tag } = req.params;
    
    // Check cache first
    const cacheKey = `questions:tag:${tag}`;
    const cachedQuestions = await cacheService.get(cacheKey);
    
    if (cachedQuestions) {
      return res.status(200).json({ questions: cachedQuestions });
    }
    
    // Fetch from database
    const questions = await Question.find({ tags: tag })
      .populate('author', 'username fullName profilePicture reputation')
      .sort({ createdAt: -1 })
      .lean();
    
    // Cache results for 5 minutes
    await cacheService.set(cacheKey, questions, 300);
    
    res.status(200).json({ questions });
  } catch (error) {
    next(error);
  }
};

// Implement feature to get trending questions
exports.getTrendingQuestions = async (req, res, next) => {
  try {
    const cacheKey = 'questions:trending';
    const cachedTrending = await cacheService.get(cacheKey);
    
    if (cachedTrending) {
      return res.status(200).json({ questions: cachedTrending });
    }
    
    const trendingQuestions = await Question.find()
      .sort({ views: -1, voteCount: -1 })
      .limit(10)
      .populate('author', 'username fullName profilePicture reputation')
      .lean();
    
    await cacheService.set(cacheKey, trendingQuestions, 600);
    
    res.status(200).json({ questions: trendingQuestions });
  } catch (error) {
    next(error);
  }
};

// Answer Controller - Implement CRUD operations
const Answer = require('../models/answer.model');

// Create an answer
exports.createAnswer = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.user.userId;

    // Check if the question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Create answer
    const newAnswer = new Answer({
      question: questionId,
      content,
      author: userId,
    });

    await newAnswer.save();

    // Increment answer count on question
    question.answersCount += 1;
    await question.save();

    // Clear relevant caches
    await cacheService.delete(`question:${questionId}`);
    await cacheService.clearByPattern('questions:list:*');

    res.status(201).json({
      message: 'Answer created successfully',
      answer: newAnswer,
    });
  } catch (error) {
    next(error);
  }
};

// Get answers for a question
exports.getAnswersByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const cacheKey = `answers:question:${questionId}`;
    const cachedAnswers = await cacheService.get(cacheKey);

    if (cachedAnswers) {
      return res.status(200).json({ answers: cachedAnswers });
    }

    const answers = await Answer.find({ question: questionId })
      .populate('author', 'username fullName profilePicture reputation')
      .sort({ createdAt: -1 })
      .lean();

    await cacheService.set(cacheKey, answers, 300);
    res.status(200).json({ answers });
  } catch (error) {
    next(error);
  }
};

// Implement voting on answers
exports.voteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userId;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const hasUpvoted = answer.upvotes.some(vote => vote.user.toString() === userId);
    const hasDownvoted = answer.downvotes.some(vote => vote.user.toString() === userId);

    if (voteType === 'up') {
      if (hasUpvoted) {
        answer.upvotes = answer.upvotes.filter(vote => vote.user.toString() !== userId);
      } else {
        answer.upvotes.push({ user: userId });
        if (hasDownvoted) {
          answer.downvotes = answer.downvotes.filter(vote => vote.user.toString() !== userId);
        }
      }
    } else if (voteType === 'down') {
      if (hasDownvoted) {
        answer.downvotes = answer.downvotes.filter(vote => vote.user.toString() !== userId);
      } else {
        answer.downvotes.push({ user: userId });
        if (hasUpvoted) {
          answer.upvotes = answer.upvotes.filter(vote => vote.user.toString() !== userId);
        }
      }
    }

    await answer.save();
    await cacheService.delete(`answer:${id}`);
    res.status(200).json({ message: 'Vote registered successfully', voteCount: answer.upvotes.length - answer.downvotes.length });
  } catch (error) {
    next(error);
  }
};

module.exports= exports;