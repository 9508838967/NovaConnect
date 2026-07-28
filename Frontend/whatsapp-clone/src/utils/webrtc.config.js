/**
 * WebRTC ICE / STUN configuration.
 * For production behind strict NAT, add TURN servers via env:
 *   VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL
 */

const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

/** @type {RTCIceServer[]} */
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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

/** Default getUserMedia constraints — extensible for screen share later */
export const DEFAULT_MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
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
