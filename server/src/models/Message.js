import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'system'],
    default: 'text'
  },
  attachments: [{
    type: String,
    url: String,
    name: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,

  // Moderation fields
  isFlagged: {
    type: Boolean,
    default: false
  },
  flaggedAt: Date,
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  flagReason: String,
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenAt: Date,
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hiddenReason: String,
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    category: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'scam', 'other']
    }
  }],
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isFlagged: 1 });
messageSchema.index({ isHidden: 1 });
messageSchema.index({ reportCount: -1 });

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to flag message (admin)
messageSchema.methods.flagMessage = function(adminId, reason) {
  this.isFlagged = true;
  this.flaggedAt = new Date();
  this.flaggedBy = adminId;
  this.flagReason = reason;
  return this.save();
};

// Method to hide message (admin)
messageSchema.methods.hideMessage = function(adminId, reason) {
  this.isHidden = true;
  this.hiddenAt = new Date();
  this.hiddenBy = adminId;
  this.hiddenReason = reason;
  return this.save();
};

// Method to unhide message (admin)
messageSchema.methods.unhideMessage = function() {
  this.isHidden = false;
  this.hiddenAt = null;
  this.hiddenBy = null;
  this.hiddenReason = null;
  return this.save();
};

// Method to add report
messageSchema.methods.addReport = function(userId, reason, category) {
  // Check if user already reported
  const alreadyReported = this.reports.some(
    report => report.reportedBy.toString() === userId.toString()
  );

  if (!alreadyReported) {
    this.reports.push({
      reportedBy: userId,
      reportedAt: new Date(),
      reason,
      category
    });
    this.reportCount = this.reports.length;
  }

  return this.save();
};

// Post save hook to update chat
messageSchema.post('save', async function() {
  const Chat = mongoose.model('Chat');
  await Chat.findByIdAndUpdate(this.chat, {
    lastMessage: this._id,
    lastMessageAt: this.createdAt
  });
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
