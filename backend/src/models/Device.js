const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[a-zA-Z0-9\-_]+$/,
      maxlength: 50
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    expectedInterval: {
      type: Number,
      required: true,
      default: 60,
      min: 5,
      max: 86400
    },
    lastHeartbeat: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

deviceSchema.virtual('status').get(function getStatus() {
  if (!this.lastHeartbeat) {
    return 'pending';
  }

  const elapsedSeconds = (Date.now() - this.lastHeartbeat.getTime()) / 1000;
  return elapsedSeconds <= this.expectedInterval ? 'online' : 'offline';
});

deviceSchema.index({ lastHeartbeat: 1 });
deviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Device', deviceSchema);
