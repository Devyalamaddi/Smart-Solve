// Message Controller - Implement messaging features
const Message = require('../models/message.model');
const User = require('../models/user.model');
const io = require('../sockets');

// Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.userId;

    if (!receiver || !content.trim()) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const message = new Message({ sender, receiver, content });
    await message.save();

    io.to(receiver).emit('new_message', message);

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    next(error);
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { withUser } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: withUser },
        { sender: withUser, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(messageId, { isRead: true, readAt: new Date() }, { new: true });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete a message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;