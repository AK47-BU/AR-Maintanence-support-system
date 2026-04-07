const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // null for unauthenticated actions (failed logins)
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'TOKEN_REFRESH',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DEACTIVATED',
      'FAULT_CREATED',
      'FAULT_UPDATED',
      'FAULT_RESOLVED',
      'FAULT_ANNOTATION_ADDED',
      'TOOL_CHECK_PERFORMED',
      'TOOL_STATUS_CHANGED',
      'UNAUTHORISED_ACCESS',
      'SUSPICIOUS_ACTIVITY'
    ]
  },
  resource: {
    type: String,      // e.g. "fault", "tool", "user"
    default: null
  },
  resourceId: {
    type: String,      // ID of the affected resource
    default: null
  },
  details: {
    type: String,      // Human-readable description
    default: ''
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient security queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ success: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
