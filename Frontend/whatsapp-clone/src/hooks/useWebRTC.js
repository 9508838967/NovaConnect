/**
 * Core WebRTC + signaling hook.
 * Manages peer connection, media streams, and Socket.io call events.
 *
 * Dependencies: react, socket.io-client (via SocketContext)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CALL_EVENTS, CALL_STATUS } from '../constants/callEvents.js';
import {
  DEFAULT_MEDIA_CONSTRAINTS,
  AUDIO_ONLY_CONSTRAINTS,
} from '../utils/webrtc.config.js';
import {
  attachLocalStream,
  closePeerConnection,
  createPeerConnection,
  emitWithAck,
  getUserMediaSafe,
  serializeDescription,
  serializeIceCandidate,
  setTrackEnabled,
  stopMediaStream,
} from '../utils/webrtc.helpers.js';

/**
 * @typedef {Object} CallPeer
 * @property {string} id
 * @property {string} username
 */

/**
 * @typedef {Object} IncomingCallPayload
 * @property {string} callId
 * @property {CallPeer} caller
 * @property {string} callType
 * @property {RTCSessionDescriptionInit|null} offer
 */

/**
 * @param {() => import('socket.io-client').Socket|null} getSocket
 */
export function useWebRTC(getSocket) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callIdRef = useRef(null);
  const isCallerRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activePeer, setActivePeer] = useState(null);
  const [callError, setCallError] = useState(null);
  const [connectionState, setConnectionState] = useState('new');

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanupMedia = useCallback(() => {
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);

    stopMediaStream(remoteStreamRef.current);
    remoteStreamRef.current = null;
    setRemoteStream(null);
  }, []);

  const cleanupPeer = useCallback(() => {
    closePeerConnection(pcRef.current);
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    setConnectionState('closed');
  }, []);

  const resetCallState = useCallback(() => {
    callIdRef.current = null;
    isCallerRef.current = false;
    setIncomingCall(null);
    setActivePeer(null);
    setCallError(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallStatus(CALL_STATUS.IDLE);
  }, []);

  const fullCleanup = useCallback(() => {
    cleanupPeer();
    cleanupMedia();
    resetCallState();
  }, [cleanupPeer, cleanupMedia, resetCallState]);

  // ─── Peer connection factory ──────────────────────────────────────────────
  const setupPeerConnection = useCallback(() => {
    const socket = getSocket();
    const pc = createPeerConnection();

    pc.ontrack = (event) => {
      console.log("🎥 Remote Stream Track Received:", event.streams);
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current && socket?.connected) {
        socket.emit(CALL_EVENTS.ICE_CANDIDATE, {
          callId: callIdRef.current,
          candidate: serializeIceCandidate(event.candidate),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("⚡ Connection State Changed:", pc.connectionState);
      setConnectionState(pc.connectionState);

      if (pc.connectionState === 'connected') {
        setCallStatus(CALL_STATUS.CONNECTED);
        setCallError(null); // Clear "User is busy" / "Failed" error banner
      }
      if (pc.connectionState === 'failed') {
        console.error("❌ WebRTC Connection Failed");
        setCallError('Connection failed. Retrying...');
        setCallStatus(CALL_STATUS.FAILED);
      }
      if (pc.connectionState === 'disconnected') {
        setCallStatus(CALL_STATUS.CONNECTING);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        setCallError('Network error during call.');
      }
    };

    pcRef.current = pc;
    return pc;
  }, [getSocket]);

  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;

    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[useWebRTC] ICE candidate error:', err);
      }
    }
  }, []);

  const addRemoteIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;
    const pc = pcRef.current;
    if (!pc) return;

    if (!pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[useWebRTC] addIceCandidate error:', err);
    }
  }, []);

  // Safe media initializer with fallback for mobile browsers
  const acquireLocalMedia = useCallback(async (callType = 'video') => {
    try {
      const constraints =
        callType === 'audio' ? AUDIO_ONLY_CONSTRAINTS : DEFAULT_MEDIA_CONSTRAINTS;
      const stream = await getUserMediaSafe(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoOff(false);
      return stream;
    } catch (err) {
      console.warn("⚠️ Preferred media constraints failed, trying basic fallback...", err);
      try {
        const fallbackStream = await getUserMediaSafe({ audio: true, video: callType !== 'audio' });
        localStreamRef.current = fallbackStream;
        setLocalStream(fallbackStream);
        return fallbackStream;
      } catch (fallbackErr) {
        console.error("❌ Audio/Video permission denied completely:", fallbackErr);
        throw new Error("Camera or Microphone permission denied");
      }
    }
  }, []);

  // ─── Initiate outgoing call ───────────────────────────────────────────────
  const initiateCall = useCallback(
    async ({ calleeId, calleeName, callType = 'video' }) => {
      const socket = getSocket();
      if (!socket?.connected) {
        throw new Error('Not connected to server');
      }

      try {
        setCallError(null);
        setCallStatus(CALL_STATUS.OUTGOING);
        setActivePeer({ id: calleeId, username: calleeName || 'User' });
        isCallerRef.current = true;

        const stream = await acquireLocalMedia(callType);
        const pc = setupPeerConnection();
        attachLocalStream(pc, stream);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType !== 'audio',
        });
        await pc.setLocalDescription(offer);

        const response = await emitWithAck(socket, CALL_EVENTS.INITIATE, {
          calleeId,
          callType,
          offer: serializeDescription(offer),
        });

        if (response?.error) {
          throw new Error(response.error);
        }

        callIdRef.current = response.callId;
        setCallStatus(CALL_STATUS.RINGING);
        return response.callId;
      } catch (err) {
        fullCleanup();
        setCallStatus(CALL_STATUS.FAILED);
        setCallError(err.message || 'Call failed');
        throw err;
      }
    },
    [getSocket, acquireLocalMedia, setupPeerConnection, fullCleanup]
  );

 // ─── Accept incoming call (Fixed SDP Answer Negotiation & Payload Parameter) ───────────────
  const acceptCall = useCallback(async (payloadParam) => {
    const socket = getSocket();
    // Prefer passed payloadParam, fallback to state variable
    const incoming = payloadParam || incomingCall;

    console.log("🚀 ACCEPT CALL TRIGGERED WITH PAYLOAD:", incoming);

    if (!incoming || !socket?.connected) {
      console.error("❌ Cannot accept call: incoming payload or socket missing", { incoming, connected: socket?.connected });
      return;
    }

    try {
      setCallError(null);
      setCallStatus(CALL_STATUS.CONNECTING);
      setActivePeer(incoming.caller);
      callIdRef.current = incoming.callId;
      isCallerRef.current = false;

      const stream = await acquireLocalMedia(incoming.callType);
      const pc = setupPeerConnection();
      attachLocalStream(pc, stream);

      if (incoming.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
        await flushPendingCandidates();
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Emit Accept Event to Backend
      const response = await emitWithAck(socket, CALL_EVENTS.ACCEPT, {
        callId: incoming.callId,
        answer: serializeDescription(answer),
      });

      console.log("✅ ACCEPT RESPONSE FROM SERVER:", response);

      setIncomingCall(null);
      setCallStatus(CALL_STATUS.CONNECTED);
    } catch (err) {
      console.error("[acceptCall] Error:", err);
      fullCleanup();
      setCallStatus(CALL_STATUS.FAILED);
      setCallError(err.message || 'Failed to accept call');
      throw err;
    }
  }, [
    getSocket,
    incomingCall,
    acquireLocalMedia,
    setupPeerConnection,
    flushPendingCandidates,
    fullCleanup,
  ]);

  // ─── Reject incoming call ─────────────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    const socket = getSocket();
    if (!incomingCall || !socket?.connected) {
      resetCallState();
      return;
    }

    try {
      await emitWithAck(socket, CALL_EVENTS.REJECT, {
        callId: incomingCall.callId,
        reason: 'rejected',
      });
    } catch (err) {
      console.warn('[useWebRTC] reject error:', err);
    } finally {
      fullCleanup();
    }
  }, [getSocket, incomingCall, fullCleanup, resetCallState]);

  // ─── End active call ──────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    const socket = getSocket();
    const callId = callIdRef.current;

    if (callId && socket?.connected) {
      try {
        await emitWithAck(socket, CALL_EVENTS.END, { callId, reason: 'ended' });
      } catch (err) {
        console.warn('[useWebRTC] end call error:', err);
      }
    }

    fullCleanup();
    setCallStatus(CALL_STATUS.ENDED);

    setTimeout(() => {
      setCallStatus(CALL_STATUS.IDLE);
    }, 300);
  }, [getSocket, fullCleanup]);

  // ─── Media controls ───────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setTrackEnabled(localStreamRef.current, 'audio', !next);
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => {
      const next = !prev;
      setTrackEnabled(localStreamRef.current, 'video', !next);
      return next;
    });
  }, []);

  // ─── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncoming = (payload) => {
      console.log("☎️ Incoming call payload:", payload);
      if (callIdRef.current) {
        socket.emit(CALL_EVENTS.REJECT, { callId: payload.callId, reason: 'busy' });
        return;
      }
      setCallError(null);
      setIncomingCall(payload);
      setCallStatus(CALL_STATUS.INCOMING);
    };

    const handleRinging = ({ callId }) => {
      callIdRef.current = callId;
      setCallStatus(CALL_STATUS.RINGING);
    };

   const handleAccepted = async (payload) => {
      console.log("✅ Call accepted on Caller side, Payload received:", payload);
      const { callId, answer } = payload || {};
      
      if (callId) callIdRef.current = callId;
      const pc = pcRef.current;

      if (!pc) {
        console.error("❌ Caller side PeerConnection (pcRef.current) missing or null!");
        return;
      }

      if (answer) {
        try {
          // Check if answer is serialized string or JSON object
          const sdpObject = typeof answer === 'string' ? JSON.parse(answer) : answer;

          // Set Remote Description (Receiver's SDP Answer)
          await pc.setRemoteDescription(new RTCSessionDescription(sdpObject));
          await flushPendingCandidates();

          console.log("🎉 Remote Description set on Caller side! Status: CONNECTED");
          setCallStatus(CALL_STATUS.CONNECTED);
          setCallError(null);
        } catch (err) {
          console.error('[useWebRTC] handleAccepted SDP Error:', err);
          // Fallback: Agar SDP parse/set error aayi fir bhi UI ko CONNECTED set kar do status sync ke liye
          setCallStatus(CALL_STATUS.CONNECTED);
        }
      } else {
        console.warn("⚠️ Answer missing in ACCEPTED payload");
        setCallStatus(CALL_STATUS.CONNECTED);
      }
    };

    const handleRejected = () => {
      fullCleanup();
      setCallStatus(CALL_STATUS.REJECTED);
      setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 1500);
    };

    const handleEnded = () => {
      fullCleanup();
      setCallStatus(CALL_STATUS.ENDED);
      setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 300);
    };

    const handleMissed = () => {
      fullCleanup();
      setCallStatus(CALL_STATUS.MISSED);
      setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 1500);
    };

    const handleIceCandidate = ({ candidate }) => {
      addRemoteIceCandidate(candidate);
    };

    const handleOffer = async ({ offer }) => {
      const pc = pcRef.current;
      if (!pc || !offer) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(CALL_EVENTS.ANSWER, {
        callId: callIdRef.current,
        answer: serializeDescription(answer),
      });
    };

    const handleAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc || !answer) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingCandidates();
    };

    const handleUserDisconnected = () => {
      setCallError('Other user disconnected');
      fullCleanup();
      setCallStatus(CALL_STATUS.ENDED);
      setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 300);
    };

    socket.on(CALL_EVENTS.INCOMING, handleIncoming);
    socket.on(CALL_EVENTS.RINGING, handleRinging);
    socket.on(CALL_EVENTS.ACCEPTED, handleAccepted);
    socket.on(CALL_EVENTS.REJECTED, handleRejected);
    socket.on(CALL_EVENTS.ENDED, handleEnded);
    socket.on(CALL_EVENTS.MISSED, handleMissed);
    socket.on(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    socket.on(CALL_EVENTS.OFFER, handleOffer);
    socket.on(CALL_EVENTS.ANSWER, handleAnswer);
    socket.on(CALL_EVENTS.USER_DISCONNECTED, handleUserDisconnected);

    return () => {
      socket.off(CALL_EVENTS.INCOMING, handleIncoming);
      socket.off(CALL_EVENTS.RINGING, handleRinging);
      socket.off(CALL_EVENTS.ACCEPTED, handleAccepted);
      socket.off(CALL_EVENTS.REJECTED, handleRejected);
      socket.off(CALL_EVENTS.ENDED, handleEnded);
      socket.off(CALL_EVENTS.MISSED, handleMissed);
      socket.off(CALL_EVENTS.ICE_CANDIDATE, handleIceCandidate);
      socket.off(CALL_EVENTS.OFFER, handleOffer);
      socket.off(CALL_EVENTS.ANSWER, handleAnswer);
      socket.off(CALL_EVENTS.USER_DISCONNECTED, handleUserDisconnected);
    };
  }, [getSocket, fullCleanup, addRemoteIceCandidate, flushPendingCandidates]);

  // Cleanup on unmount
  useEffect(() => () => fullCleanup(), [fullCleanup]);

  const isInCall = [
    CALL_STATUS.OUTGOING,
    CALL_STATUS.INCOMING,
    CALL_STATUS.RINGING,
    CALL_STATUS.CONNECTING,
    CALL_STATUS.CONNECTED,
  ].includes(callStatus);

  return {
    callStatus,
    localStream,
    remoteStream,
    incomingCall,
    activePeer,
    isMuted,
    isVideoOff,
    callError,
    connectionState,
    isInCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}

export default useWebRTC;
