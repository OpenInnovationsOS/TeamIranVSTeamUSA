const mongoose = require('../database/mongodb-connection').mongoose;
const { Schema } = mongoose;

const transactionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ton', 'stg', 'win']
  },
  amount: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  transaction_hash: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'failed']
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// Indexes for performance
transactionSchema.index({ user_id: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ created_at: -1 });
transactionSchema.index({ status: 1 });

// Static methods
transactionSchema.statics.createTransaction = async function(transactionData) {
  const transaction = new this(transactionData);
  return await transaction.save();
};

transactionSchema.statics.getUserTransactions = function(userId, limit = 50, type = null) {
  const query = { user_id: userId };
  if (type) query.type = type;

  return this.find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .populate('user_id', 'telegram_id username');
};

transactionSchema.statics.getTransactionsByType = function(type, limit = 100) {
  return this.find({ type })
    .sort({ created_at: -1 })
    .limit(limit)
    .populate('user_id', 'telegram_id username');
};

transactionSchema.statics.getPendingTransactions = function() {
  return this.find({ status: 'pending' })
    .sort({ created_at: 1 })
    .populate('user_id', 'telegram_id username');
};

transactionSchema.statics.markCompleted = async function(transactionId, transactionHash = null) {
  const updateData = { status: 'completed' };
  if (transactionHash) updateData.transaction_hash = transactionHash;

  return this.findByIdAndUpdate(transactionId, updateData, { new: true });
};

transactionSchema.statics.markFailed = function(transactionId, reason) {
  return this.findByIdAndUpdate(
    transactionId, 
    { 
      status: 'failed',
      metadata: { failure_reason: reason }
    }, 
    { new: true }
  );
};

// Instance methods
transactionSchema.methods.complete = async function(transactionHash = null) {
  this.status = 'completed';
  if (transactionHash) this.transaction_hash = transactionHash;
  return await this.save();
};

transactionSchema.methods.fail = async function(reason) {
  this.status = 'failed';
  this.metadata = { failure_reason: reason };
  return await this.save();
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
