const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new mongoose.Schema({
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
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
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  comments: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting the vote count
answerSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Indexes for better performance
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1 });
answerSchema.index({ isAccepted: 1 });

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;