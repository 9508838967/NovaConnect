/**
 * Persists completed call sessions to MongoDB (fire-and-forget).
 * Keeps signaling handler thin and testable.
 */

const Call = require('../../models/Call.model');
const { CALL_STATUS } = require('../../config/call.constants');

/**
 * @param {import('../services/CallSessionStore').CallSession} session
 */
async function persistCallSession(session) {
  if (!session) return;

  const durationSeconds =
    session.connectedAt && session.endedAt
      ? Math.floor((session.endedAt - session.connectedAt) / 1000)
      : 0;

  try {
    await Call.findOneAndUpdate(
      { callId: session.callId },
      {
        callId: session.callId,
        caller: session.callerId,
        callee: session.calleeId,
        callType: session.callType,
        status: session.status,
        startedAt: new Date(session.createdAt),
        connectedAt: session.connectedAt ? new Date(session.connectedAt) : undefined,
        endedAt: session.endedAt ? new Date(session.endedAt) : new Date(),
        durationSeconds,
        endReason: session.endReason || 'ended',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('[CallService] Failed to persist call:', err.message);
  }
}

/**
 * Mark a ringing call as missed and persist.
 * @param {import('../services/CallSessionStore').CallSession} session
 */
async function markCallMissed(session) {
  if (!session) return;
  session.status = CALL_STATUS.MISSED;
  session.endedAt = Date.now();
  session.endReason = 'missed';
  await persistCallSession(session);
}

module.exports = {
  persistCallSession,
  markCallMissed,
};
