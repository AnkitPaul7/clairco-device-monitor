const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    message: {
      type: String,
      required: true
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'acknowledged'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

alertSchema.index({ deviceId: 1, status: 1 });
alertSchema.index({ triggeredAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
