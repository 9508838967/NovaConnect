/**
 * Low-level WebRTC helpers — pure functions, easy to unit-test.
 */

import { PEER_CONNECTION_CONFIG } from './webrtc.config.js';

/**
 * Create a configured RTCPeerConnection.
 * @param {RTCPeerConnectionConfig} [overrides]
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(overrides = {}) {
  return new RTCPeerConnection({ ...PEER_CONNECTION_CONFIG, ...overrides });
}

/**
 * Attach local MediaStream tracks to a peer connection.
 * @param {RTCPeerConnection} pc
 * @param {MediaStream} stream
 */
export function attachLocalStream(pc, stream) {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

/**
 * Stop every track on a MediaStream and release hardware.
 * @param {MediaStream|null|undefined} stream
 */
export function stopMediaStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Toggle a specific track type on a stream.
 * @param {MediaStream|null} stream
 * @param {'audio'|'video'} kind
 * @param {boolean} enabled
 */
export function setTrackEnabled(stream, kind, enabled) {
  if (!stream) return;
  stream.getTracks()
    .filter((t) => t.kind === kind)
    .forEach((t) => {
      t.enabled = enabled;
    });
}

/**
 * Serialize RTCSessionDescription for socket transport.
 * @param {RTCSessionDescriptionInit} description
 */
export function serializeDescription(description) {
  return {
    type: description.type,
    sdp: description.sdp,
  };
}

/**
 * Serialize ICE candidate for socket transport.
 * @param {RTCIceCandidate|null} candidate
 */
export function serializeIceCandidate(candidate) {
  if (!candidate) return null;
  return candidate.toJSON ? candidate.toJSON() : candidate;
}

/**
 * Promise wrapper for socket emit with acknowledgement callback.
 * @param {import('socket.io-client').Socket} socket
 * @param {string} event
 * @param {object} payload
 * @returns {Promise<object>}
 */
export function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit(event, payload, (response) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response || {});
      }
    });
  });
}

/**
 * Wait for getUserMedia with a user-friendly error message.
 * @param {MediaStreamConstraints} constraints
 * @returns {Promise<MediaStream>}
 */
export async function getUserMediaSafe(constraints) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Your browser does not support camera/microphone access.');
  }
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Camera/microphone permission denied.');
    }
    if (err.name === 'NotFoundError') {
      throw new Error('No camera or microphone found.');
    }
    throw err;
  }
}

/**
 * Close peer connection and remove all event listeners.
 * @param {RTCPeerConnection|null} pc
 */
export function closePeerConnection(pc) {
  if (!pc) return;
  pc.ontrack = null;
  pc.onicecandidate = null;
  pc.onconnectionstatechange = null;
  pc.oniceconnectionstatechange = null;
  pc.close();
}
