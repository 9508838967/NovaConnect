/**
 * Central registry for video-call signaling events and session states.
 * Keeping names in one place makes group-call and screen-share extensions trivial.
 */

const CALL_EVENTS = Object.freeze({
  // Client → Server
  INITIATE: 'call:initiate',
  ACCEPT: 'call:accept',
  REJECT: 'call:reject',
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE_CANDIDATE: 'call:ice-candidate',
  END: 'call:end',

  // Server → Client
  INCOMING: 'call:incoming',
  RINGING: 'call:ringing',
  ACCEPTED: 'call:accepted',
  REJECTED: 'call:rejected',
  ENDED: 'call:ended',
  BUSY: 'call:busy',
  MISSED: 'call:missed',
  USER_DISCONNECTED: 'call:user-disconnected',
});

const CALL_STATUS = Object.freeze({
  INITIATING: 'initiating',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  MISSED: 'missed',
  BUSY: 'busy',
  FAILED: 'failed',
});

const CALL_TYPE = Object.freeze({
  VIDEO: 'video',
  AUDIO: 'audio',
});

/** Ring timeout before marking call as missed (ms) */
const CALL_RING_TIMEOUT_MS = 45_000;

/** Max concurrent 1:1 calls per user */
const MAX_ACTIVE_CALLS_PER_USER = 1;

module.exports = {
  CALL_EVENTS,
  CALL_STATUS,
  CALL_TYPE,
  CALL_RING_TIMEOUT_MS,
  MAX_ACTIVE_CALLS_PER_USER,
};
