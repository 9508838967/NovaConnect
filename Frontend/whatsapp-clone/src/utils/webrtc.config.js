/**
 * WebRTC ICE / STUN / TURN configuration.
 */

const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

/** @type {RTCIceServer[]} */
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Hardcoded free public TURN fallback (Jab tak ENV variable Render par set na ho)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  }
];

if (turnUrl && turnUsername && turnCredential) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: turnUsername,
    credential: turnCredential,
  });
}

export const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

/** Default getUserMedia constraints — Flexible for mobile & low-end webcams */
export const DEFAULT_MEDIA_CONSTRAINTS = {
  video: {
    width: { min: 320, ideal: 640, max: 1280 },
    height: { min: 240, ideal: 480, max: 720 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export const AUDIO_ONLY_CONSTRAINTS = {
  video: false,
  audio: DEFAULT_MEDIA_CONSTRAINTS.audio,
};
