const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    minlength: 20
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  answersCount: {
    type: Number,
    default: 0
  },
  acceptedAnswer: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  closedReason: {
    type: String,
    enum: ['duplicate', 'off-topic', 'resolved', 'other'],
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  bounty: {
    amount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting the vote count
questionSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Indexes for better performance
questionSchema.index({ title: 'text', content: 'text', tags: 'text' });
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ voteCount: -1 });
questionSchema.index({ isPrivate: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;