const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: String,
  action: {
    type: String,
    enum: [
      'CREATE_ITEM',
      'UPDATE_ITEM',
      'DELETE_ITEM',
      'ADD_VARIATION',
      'DELETE_VARIATION',
      'CREATE_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'CREATE_DISCOUNT',
      'UPDATE_DISCOUNT',
      'DELETE_DISCOUNT',
      'VERIFY_PAYMENT',
      'REJECT_PAYMENT',
      'UPDATE_ORDER_STATUS',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'GENERATE_REPORT',
      'LOGIN',
      'LOGOUT',
      'OTHER'
    ],
    index: true
  },
  page: {
    type: String,
    enum: ['ADMIN', 'OWNER'],
    index: true
  },
  description: String,
  details: mongoose.Schema.Types.Mixed,
  beforeData: mongoose.Schema.Types.Mixed,
  afterData: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expire: 2592000 // Auto-delete after 30 days
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
