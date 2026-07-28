/**
 * Persists call history for the Calls tab and analytics.
 * Signaling stays in-memory (CallSessionStore); this model is written on call end.
 */

const mongoose = require('mongoose');
const { CALL_STATUS, CALL_TYPE } = require('../config/call.constants');

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callType: {
      type: String,
      enum: Object.values(CALL_TYPE),
      default: CALL_TYPE.VIDEO,
    },
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.ENDED,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    connectedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    endReason: {
      type: String,
      default: 'ended',
    },
  },
  { timestamps: true }
);

callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ callee: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
