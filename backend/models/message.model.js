const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversation: {
    type: String, // Composite key of sorted user IDs
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Create conversation ID before saving
messageSchema.pre('save', function(next) {
  if (!this.conversation) {
    const ids = [this.sender.toString(), this.receiver.toString()].sort();
    this.conversation = ids.join('_');
  }
  next();
});

// Indexes for better performance
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;