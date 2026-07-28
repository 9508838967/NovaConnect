/**
 * WebRTC signaling handler — relays SDP offers/answers and ICE candidates.
 * Media never touches the server; only metadata is forwarded.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../../models/User.model')} user
 */

const callSessionStore = require('../services/CallSessionStore');
const { persistCallSession, markCallMissed } = require('../services/call.service');
const SocketStore = require('../utils/socketStore');
const {
  CALL_EVENTS,
  CALL_STATUS,
} = require('../../config/call.constants');

/**
 * Emit an event to a user's personal room.
 * @param {import('socket.io').Server} io
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(io, userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Notify both parties that the call ended.
 * @param {import('socket.io').Server} io
 * @param {object} session
 * @param {string} reason
 * @param {string} [endedBy]
 */
function broadcastCallEnded(io, session, reason, endedBy) {
  const payload = {
    callId: session.callId,
    reason,
    endedBy: endedBy || null,
    status: CALL_STATUS.ENDED,
  };

  emitToUser(io, session.callerId, CALL_EVENTS.ENDED, payload);
  emitToUser(io, session.calleeId, CALL_EVENTS.ENDED, payload);
}

module.exports = (io, socket, user) => {
  const userId = user._id.toString();

  // ─── Initiate call (caller → server → callee) ───────────────────────────
  socket.on(CALL_EVENTS.INITIATE, async (data, callback) => {
    try {
      const { calleeId, offer, callType = 'video' } = data || {};

      if (!calleeId) {
        return callback?.({ error: 'calleeId is required' });
      }

      const calleeOnline = await SocketStore.isUserOnline(calleeId);
      if (!calleeOnline) {
        return callback?.({ error: 'User is offline' });
      }

      const { session, error } = callSessionStore.createSession({
        callerId: userId,
        calleeId: String(calleeId),
        callType,
      });

      if (error === 'busy') {
        return callback?.({ error: 'User is busy' });
      }
      if (error || !session) {
        return callback?.({ error: error || 'Failed to create call session' });
      }

      // Notify callee
      emitToUser(io, session.calleeId, CALL_EVENTS.INCOMING, {
        callId: session.callId,
        caller: {
          id: userId,
          username: user.username,
        },
        callType: session.callType,
        offer: offer || null,
      });

      // Confirm to caller
      emitToUser(io, session.callerId, CALL_EVENTS.RINGING, {
        callId: session.callId,
        calleeId: session.calleeId,
      });

      // Auto-miss if not answered in time
      callSessionStore.startRingTimer(session.callId, async () => {
        const current = callSessionStore.getSession(session.callId);
        if (!current || current.status !== CALL_STATUS.RINGING) return;

        callSessionStore.endSession(session.callId, 'missed');
        await markCallMissed(current);

        emitToUser(io, session.callerId, CALL_EVENTS.MISSED, {
          callId: session.callId,
        });
        emitToUser(io, session.calleeId, CALL_EVENTS.MISSED, {
          callId: session.callId,
        });
      });

      callback?.({ success: true, callId: session.callId });
    } catch (err) {
      console.error('[videoCall] initiate error:', err);
      callback?.({ error: 'Failed to initiate call' });
    }
  });

  // ─── Accept call (callee sends answer SDP) ────────────────────────────────
  socket.on(CALL_EVENTS.ACCEPT, async (data, callback) => {
    try {
      const { callId, answer } = data || {};
      const session = callSessionStore.getSession(callId);

      if (!session) {
        return callback?.({ error: 'Call session not found' });
      }
      if (session.calleeId !== userId) {
        return callback?.({ error: 'Only the callee can accept' });
      }
      if (session.status !== CALL_STATUS.RINGING) {
        return callback?.({ error: 'Call is no longer ringing' });
      }

      callSessionStore.clearRingTimer(callId);
      callSessionStore.updateStatus(callId, CALL_STATUS.CONNECTING);

      emitToUser(io, session.callerId, CALL_EVENTS.ACCEPTED, {
        callId,
        answer: answer || null,
        callee: { id: userId, username: user.username },
      });

      callSessionStore.updateStatus(callId, CALL_STATUS.CONNECTED);
      callback?.({ success: true, callId });
    } catch (err) {
      console.error('[videoCall] accept error:', err);
      callback?.({ error: 'Failed to accept call' });
    }
  });

  // ─── Reject call ──────────────────────────────────────────────────────────
  socket.on(CALL_EVENTS.REJECT, async (data, callback) => {
    try {
      const { callId, reason = 'rejected' } = data || {};
      const session = callSessionStore.getSession(callId);

      if (!session) {
        return callback?.({ error: 'Call session not found' });
      }
      if (!callSessionStore.isParticipant(session, userId)) {
        return callback?.({ error: 'Not a participant' });
      }

      callSessionStore.clearRingTimer(callId);
      session.status = CALL_STATUS.REJECTED;
      callSessionStore.endSession(callId, reason);

      emitToUser(io, session.callerId, CALL_EVENTS.REJECTED, {
        callId,
        reason,
        rejectedBy: userId,
      });

      await persistCallSession(session);
      callback?.({ success: true });
    } catch (err) {
      console.error('[videoCall] reject error:', err);
      callback?.({ error: 'Failed to reject call' });
    }
  });

  // ─── SDP renegotiation (offer) ────────────────────────────────────────────
  socket.on(CALL_EVENTS.OFFER, (data) => {
    const { callId, offer } = data || {};
    const session = callSessionStore.getSession(callId);
    if (!session || !callSessionStore.isParticipant(session, userId)) return;

    const peerId = callSessionStore.getPeerId(session, userId);
    if (peerId) {
      emitToUser(io, peerId, CALL_EVENTS.OFFER, { callId, offer, from: userId });
    }
  });

  // ─── SDP renegotiation (answer) ───────────────────────────────────────────
  socket.on(CALL_EVENTS.ANSWER, (data) => {
    const { callId, answer } = data || {};
    const session = callSessionStore.getSession(callId);
    if (!session || !callSessionStore.isParticipant(session, userId)) return;

    const peerId = callSessionStore.getPeerId(session, userId);
    if (peerId) {
      emitToUser(io, peerId, CALL_EVENTS.ANSWER, { callId, answer, from: userId });
    }
  });

  // ─── ICE candidate relay ──────────────────────────────────────────────────
  socket.on(CALL_EVENTS.ICE_CANDIDATE, (data) => {
    const { callId, candidate } = data || {};
    const session = callSessionStore.getSession(callId);
    if (!session || !callSessionStore.isParticipant(session, userId)) return;

    const peerId = callSessionStore.getPeerId(session, userId);
    if (peerId) {
      emitToUser(io, peerId, CALL_EVENTS.ICE_CANDIDATE, {
        callId,
        candidate,
        from: userId,
      });
    }
  });

  // ─── End call ─────────────────────────────────────────────────────────────
  socket.on(CALL_EVENTS.END, async (data, callback) => {
    try {
      const { callId, reason = 'ended' } = data || {};
      const session = callSessionStore.getSession(callId);

      if (!session) {
        return callback?.({ error: 'Call session not found' });
      }
      if (!callSessionStore.isParticipant(session, userId)) {
        return callback?.({ error: 'Not a participant' });
      }

      callSessionStore.endSession(callId, reason);
      broadcastCallEnded(io, session, reason, userId);
      await persistCallSession(session);

      callback?.({ success: true });
    } catch (err) {
      console.error('[videoCall] end error:', err);
      callback?.({ error: 'Failed to end call' });
    }
  });

  // ─── Cleanup on socket disconnect ─────────────────────────────────────────
  socket.on('disconnect', async () => {
    const endedSessions = callSessionStore.endCallsForUser(userId);

    for (const session of endedSessions) {
      const peerId = callSessionStore.getPeerId(session, userId);
      if (peerId) {
        emitToUser(io, peerId, CALL_EVENTS.USER_DISCONNECTED, {
          callId: session.callId,
          userId,
        });
        emitToUser(io, peerId, CALL_EVENTS.ENDED, {
          callId: session.callId,
          reason: 'peer_disconnected',
          status: CALL_STATUS.ENDED,
        });
      }
      await persistCallSession(session);
    }
  });
};

module.exports.emitToUser = emitToUser;
module.exports.broadcastCallEnded = broadcastCallEnded;
