import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ bloodRequest: 1 });
chatSchema.index({ lastMessageAt: -1 });

// Validate participants
chatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Chat must have exactly 2 participants'));
  } else {
    next();
  }
});

// Method to increment unread count
chatSchema.methods.incrementUnread = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Static method to find or create chat
chatSchema.statics.findOrCreate = async function(participant1, participant2, bloodRequestId = null) {
  const participants = [participant1, participant2].sort();

  let chat = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });

  if (!chat) {
    chat = await this.create({
      participants,
      bloodRequest: bloodRequestId,
      unreadCount: {
        [participant1.toString()]: 0,
        [participant2.toString()]: 0
      }
    });
  }

  return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
