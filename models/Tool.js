const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tool name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['hand_tool', 'power_tool', 'diagnostic', 'safety_equipment', 'other'],
    required: true
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values
  },
  status: {
    type: String,
    enum: ['available', 'checked_out', 'missing', 'maintenance'],
    default: 'available'
  },
  depot: {
    type: String,
    default: 'Main Depot'
  }
}, {
  timestamps: true
});

// Tool check records — logs of AR tool checks
const toolCheckSchema = new mongoose.Schema({
  // Who performed the check
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Context
  depot: {
    type: String,
    default: 'Main Depot'
  },
  vehicleId: {
    type: String,
    default: null
  },
  checkType: {
    type: String,
    enum: ['pre_shift', 'post_shift', 'spot_check'],
    required: true
  },

  // What was expected vs what was found
  expectedTools: [{
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    name: String
  }],
  detectedTools: [{
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    name: String,
    confidence: Number  // AR detection confidence 0-1
  }],
  missingTools: [{
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    name: String
  }],
  unexpectedTools: [{
    name: String,
    confidence: Number
  }],

  // Results
  totalExpected: { type: Number, default: 0 },
  totalDetected: { type: Number, default: 0 },
  totalMissing: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },

  notes: { type: String, default: '' }
}, {
  timestamps: true
});

toolCheckSchema.index({ performedBy: 1 });
toolCheckSchema.index({ createdAt: -1 });

const Tool = mongoose.model('Tool', toolSchema);
const ToolCheck = mongoose.model('ToolCheck', toolCheckSchema);

module.exports = { Tool, ToolCheck };
