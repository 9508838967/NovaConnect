/**
 * Shared call event names — must mirror Backend/src/config/call.constants.js
 */
export const CALL_EVENTS = Object.freeze({
  INITIATE: 'call:initiate',
  ACCEPT: 'call:accept',
  REJECT: 'call:reject',
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE_CANDIDATE: 'call:ice-candidate',
  END: 'call:end',

  INCOMING: 'call:incoming',
  RINGING: 'call:ringing',
  ACCEPTED: 'call:accepted',
  REJECTED: 'call:rejected',
  ENDED: 'call:ended',
  BUSY: 'call:busy',
  MISSED: 'call:missed',
  USER_DISCONNECTED: 'call:user-disconnected',
});

export const CALL_STATUS = Object.freeze({
  IDLE: 'idle',
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  MISSED: 'missed',
  FAILED: 'failed',
});

export const CALL_TYPE = Object.freeze({
  VIDEO: 'video',
  AUDIO: 'audio',
});
