/**
 * In-memory call session registry.
 * Designed for 1:1 today; swap backing store (Redis) for horizontal scale later.
 * Group calls can extend sessions with a `participants[]` map keyed by userId.
 */

const { randomUUID } = require('crypto');
const {
  CALL_STATUS,
  CALL_RING_TIMEOUT_MS,
  MAX_ACTIVE_CALLS_PER_USER,
} = require('../../config/call.constants');

class CallSessionStore {
  constructor() {
    /** @type {Map<string, CallSession>} callId → session */
    this.sessions = new Map();
    /** @type {Map<string, string>} userId → active callId */
    this.userActiveCall = new Map();
    /** @type {Map<string, NodeJS.Timeout>} callId → ring timer */
    this.ringTimers = new Map();
  }

  /**
   * @typedef {Object} CallParticipant
   * @property {string} userId
   * @property {string} username
   */

  /**
   * @typedef {Object} CallSession
   * @property {string} callId
   * @property {string} callerId
   * @property {string} calleeId
   * @property {string} callType
   * @property {string} status
   * @property {number} createdAt
   * @property {number|null} connectedAt
   * @property {number|null} endedAt
   * @property {string|null} endReason
   */

  /**
   * Returns true if user is already in an active (non-ended) call.
   * @param {string} userId
   */
  isUserBusy(userId) {
  const id = String(userId);
  const callId = this.userActiveCall.get(id);
  if (!callId) return false;

  const session = this.sessions.get(callId);
  if (!session || session.status === CALL_STATUS.ENDED || session.status === CALL_STATUS.REJECTED || session.status === CALL_STATUS.FAILED) {
    this.userActiveCall.delete(id); // Stale reference clear karein
    return false;
  }
  return true;
}

  /**
   * @param {string} userId
   * @returns {CallSession|null}
   */
  getActiveCallForUser(userId) {
    const callId = this.userActiveCall.get(String(userId));
    return callId ? this.sessions.get(callId) || null : null;
  }

  /**
   * @param {string} callId
   * @returns {CallSession|null}
   */
  getSession(callId) {
    return this.sessions.get(callId) || null;
  }

  /**
   * Create a new 1:1 call session.
   * @param {{ callerId: string, calleeId: string, callType?: string }} params
   * @returns {{ session: CallSession, error?: string }}
   */
  createSession({ callerId, calleeId, callType = 'video' }) {
    const caller = String(callerId);
    const callee = String(calleeId);

    if (caller === callee) {
      return { session: null, error: 'Cannot call yourself' };
    }

    if (this.isUserBusy(caller) || this.isUserBusy(callee)) {
      return { session: null, error: 'busy' };
    }

    const callId = randomUUID();
    /** @type {CallSession} */
    const session = {
      callId,
      callerId: caller,
      callerSocketId: socket.id,
      calleeId: callee,
      callType,
      status: CALL_STATUS.RINGING,
      createdAt: Date.now(),
      connectedAt: null,
      endedAt: null,
      endReason: null,
    };

    this.sessions.set(callId, session);
    this.userActiveCall.set(caller, callId);
    this.userActiveCall.set(callee, callId);

    return { session };
  }

  /**
   * @param {string} callId
   * @param {string} status
   */
  updateStatus(callId, status) {
  const session = this.sessions.get(callId);
  if (!session) return null;

  session.status = status;
  if (status === CALL_STATUS.CONNECTED) {
    session.connectedAt = Date.now();
  }
  if (status === CALL_STATUS.ENDED || status === CALL_STATUS.FAILED || status === CALL_STATUS.REJECTED) {
    session.endedAt = Date.now();
    // User ko active map se clear karna zaroori hai
    this.userActiveCall.delete(session.callerId);
    this.userActiveCall.delete(session.calleeId);
    this.clearRingTimer(callId);
  }
  return session;
}

  /**
   * @param {string} callId
   * @param {string} [reason]
   */
  endSession(callId, reason = 'ended') {
    const session = this.sessions.get(callId);
    if (!session) return null;

    session.status = CALL_STATUS.ENDED;
    session.endedAt = Date.now();
    session.endReason = reason;

    this.userActiveCall.delete(session.callerId);
    this.userActiveCall.delete(session.calleeId);
    this.clearRingTimer(callId);

    return session;
  }

  /**
   * End every active call involving a disconnected user.
   * @param {string} userId
   * @returns {CallSession[]}
   */
  endCallsForUser(userId) {
    const id = String(userId);
    const ended = [];

    for (const session of this.sessions.values()) {
      if (
        session.status !== CALL_STATUS.ENDED &&
        (session.callerId === id || session.calleeId === id)
      ) {
        this.endSession(session.callId, 'user_disconnected');
        ended.push(session);
      }
    }

    return ended;
  }

  /**
   * @param {string} callId
   * @param {() => void} onTimeout
   */
  startRingTimer(callId, onTimeout) {
    this.clearRingTimer(callId);
    const timer = setTimeout(() => {
      this.ringTimers.delete(callId);
      onTimeout();
    }, CALL_RING_TIMEOUT_MS);
    this.ringTimers.set(callId, timer);
  }

  /**
   * @param {string} callId
   */
  clearRingTimer(callId) {
    const timer = this.ringTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.ringTimers.delete(callId);
    }
  }

  /**
   * Resolve the peer userId for a 1:1 session.
   * @param {CallSession} session
   * @param {string} userId
   * @returns {string|null}
   */
  getPeerId(session, userId) {
    const id = String(userId);
    if (session.callerId === id) return session.calleeId;
    if (session.calleeId === id) return session.callerId;
    return null;
  }

  /**
   * Verify user belongs to session.
   * @param {CallSession} session
   * @param {string} userId
   */
  isParticipant(session, userId) {
    const id = String(userId);
    return session.callerId === id || session.calleeId === id;
  }
}

/** Singleton — shared across all socket connections on this process */
const callSessionStore = new CallSessionStore();

module.exports = callSessionStore;
