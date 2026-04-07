const mongoose = require('mongoose');

const faultSchema = new mongoose.Schema({
  // What fault was found
  title: {
    type: String,
    required: [true, 'Fault title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: [
      'structural',    // Body panel damage, corrosion
      'electrical',    // Wiring, lighting, signalling
      'mechanical',    // Engine, suspension, brakes
      'wear',          // Tyre degradation, material stress
      'safety',        // Safety equipment issues
      'other'
    ],
    required: [true, 'Fault type is required']
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: [true, 'Severity level is required']
  },
  status: {
    type: String,
    enum: ['detected', 'confirmed', 'in_progress', 'resolved', 'false_alarm'],
    default: 'detected'
  },

  // Where it was found
  location: {
    area: {
      type: String,          // e.g. "Bus exterior - left panel", "Engine bay"
      required: true
    },
    depot: {
      type: String,          // e.g. "Bournemouth Main Depot"
      default: 'Main Depot'
    },
    vehicleId: {
      type: String,          // Bus registration or fleet number
      default: null
    },
    markerRef: {
      type: String,          // Reference to the AR marker that detected it
      default: null
    }
  },

  // AR-specific data
  arData: {
    markerType: String,       // Type of AR marker used
    confidence: Number,       // Detection confidence 0-1
    overlayPosition: {        // Position of the AR overlay
      x: Number,
      y: Number,
      z: Number
    },
    screenshot: String        // Base64 or URL of AR screenshot
  },

  // Annotations added by engineers
  annotations: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Who detected and resolved it
  detectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
faultSchema.index({ status: 1, severity: 1 });
faultSchema.index({ 'location.depot': 1 });
faultSchema.index({ detectedBy: 1 });
faultSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Fault', faultSchema);
