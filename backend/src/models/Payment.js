const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transaction_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ['token_purchase', 'energy_boost_purchase', 'premium_subscription', 'battle_fee', 'marketplace_commission'], 
    required: true 
  },
  product_details: {
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    price_usd: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    category: { type: String, required: true },
    wallet: { type: String, required: true }
  },
  payment_method: { 
    type: String, 
    enum: ['ton', 'stripe', 'coinbase', 'paypal', 'crypto'], 
    required: true 
  },
  blockchain: {
    transaction_hash: { type: String, required: true },
    wallet_address: { type: String },
    gas_used: { type: Number },
    gas_price: { type: String },
    confirmation_count: { type: Number, default: 0 },
    block_number: { type: Number },
    block_timestamp: { type: Date }
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  processed_at: { type: Date },
  failed_at: { type: Date },
  refunded_at: { type: Date },
  refund_reason: { type: String },
  metadata: {
    ip_address: { type: String },
    user_agent: { type: String },
    device_type: { type: String },
    referral_code: { type: String }
  },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
paymentSchema.virtual('total_tokens').get(function() {
  if (this.type === 'token_purchase') {
    return this.product_details.amount + (this.product_details.bonus || 0);
  }
  return 0;
});

paymentSchema.virtual('fee_amount').get(function() {
  if (this.type === 'battle_fee') {
    return this.product_details.price_usd;
  }
  return 0;
});

// Indexes for performance
paymentSchema.index({ user_id: 1, created_at: -1 });
paymentSchema.index({ type: 1, status: 1 });
paymentSchema.index({ payment_method: 1 });
paymentSchema.index({ created_at: -1 });
paymentSchema.index({ 'blockchain.transaction_hash': 1 });

// Methods
paymentSchema.methods.processPayment = function() {
  this.status = 'processing';
  this.processed_at = new Date();
  return this.save();
};

paymentSchema.methods.completePayment = function() {
  this.status = 'completed';
  this.processed_at = new Date();
  return this.save();
};

paymentSchema.methods.failPayment = function(reason) {
  this.status = 'failed';
  this.failed_at = new Date();
  if (reason) {
    this.refund_reason = reason;
  }
  return this.save();
};

paymentSchema.methods.refundPayment = function(reason) {
  this.status = 'refunded';
  this.refunded_at = new Date();
  this.refund_reason = reason;
  return this.save();
};

// Static methods
paymentSchema.statics.getUserPayments = function(userId, limit = 50) {
  return this.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit);
};

paymentSchema.statics.getPaymentAnalytics = function(timeframe = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeframe);
  
  return this.aggregate([
    { $match: { created_at: { $gte: cutoff } } },
    {
      $group: {
        _id: '$type',
        total_amount: { $sum: '$product_details.price_usd' },
        transaction_count: { $sum: 1 },
        average_amount: { $avg: '$product_details.price_usd' },
        successful_transactions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        failed_transactions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: '$total_amount' },
        total_transactions: { $sum: '$transaction_count' },
        breakdown: {
          $push: {
            type: '$_id',
            revenue: '$total_amount',
            count: '$transaction_count',
            average: '$average_amount',
            success_rate: {
              $divide: [
                '$successful_transactions',
                '$transaction_count'
              ]
            }
          }
        }
      }
    }
  ]);
};

paymentSchema.statics.getRevenueByDay = function(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return this.aggregate([
    { $match: { 
      created_at: { $gte: cutoff },
      status: 'completed'
    }},
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$created_at'
          }
        },
        daily_revenue: { $sum: '$product_details.price_usd' },
        transaction_count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

paymentSchema.statics.getTopProducts = function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$product_details.product_id',
        name: { $first: '$product_details.name' },
        revenue: { $sum: '$product_details.price_usd' },
        purchases: { $sum: 1 },
        average_price: { $avg: '$product_details.price_usd' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: limit }
  ]);
};

paymentSchema.statics.getUserSpendingStats = function(userId) {
  return this.aggregate([
    { $match: { user_id: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        total_spent: { $sum: '$product_details.price_usd' },
        total_transactions: { $sum: 1 },
        average_transaction: { $avg: '$product_details.price_usd' },
        first_purchase: { $min: '$created_at' },
        last_purchase: { $max: '$created_at' },
        spending_by_type: {
          $push: {
            type: '$type',
            amount: '$product_details.price_usd'
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
