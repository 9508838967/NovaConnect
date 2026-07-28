/**
 * Full-screen active video call UI.
 * Dependencies: react, lucide-react, CallContext, videoCall components
 */
import { ShieldAlert } from 'lucide-react';
import { CALL_STATUS } from "../constants/callEvents.js";
import { useCall } from '../context/CallContext.jsx';
import CallControls from "../components/videoCall/CallControls.jsx";
import IncomingCallModal from "../components/videoCall/IncomingCallModal.jsx";
import LocalVideo from "../components/videoCall/LocalVideo.jsx";
import RemoteVideo from "../components/videoCall/RemoteVideo.jsx";

const STATUS_LABELS = {
  [CALL_STATUS.OUTGOING]: 'Calling...',
  [CALL_STATUS.RINGING]: 'Ringing...',
  [CALL_STATUS.CONNECTING]: 'Connecting...',
  [CALL_STATUS.CONNECTED]: 'Connected',
  [CALL_STATUS.ENDED]: 'Call ended',
  [CALL_STATUS.REJECTED]: 'Call declined',
  [CALL_STATUS.MISSED]: 'Missed call',
  [CALL_STATUS.FAILED]: 'Call failed',
};

export default function VideoCallPage({ onClose }) {
  const {
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
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const peerName = activePeer?.username || incomingCall?.caller?.username || 'Contact';
  const statusLabel = STATUS_LABELS[callStatus] || callStatus;

  if (callStatus === CALL_STATUS.INCOMING && incomingCall) {
    return (
      <IncomingCallModal
        caller={incomingCall.caller}
        callType={incomingCall.callType}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    );
  }

  if (!isInCall && callStatus === CALL_STATUS.IDLE) {
    return null;
  }

  const handleEnd = async () => {
    await endCall();
    onClose?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0b141a',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          marginTop: '24px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#1fa855',
            fontSize: '11px',
            backgroundColor: 'rgba(31,168,85,0.1)',
            padding: '4px 12px',
            borderRadius: '12px',
          }}
        >
          <ShieldAlert size={12} />
          <span>End-to-end encrypted</span>
        </div>
        <h2 style={{ margin: '8px 0 0', fontSize: '20px', color: '#e9edef', fontWeight: 600 }}>
          {peerName}
        </h2>
        <span style={{ fontSize: '13px', color: '#8696a0' }}>{statusLabel}</span>
        {connectionState === 'connected' && (
          <span style={{ fontSize: '11px', color: '#1fa855' }}>HD</span>
        )}
        {callError && (
          <span style={{ fontSize: '12px', color: '#ea0038', marginTop: '4px' }}>{callError}</span>
        )}
      </div>

      {/* Video area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          margin: '16px 0',
          position: 'relative',
          minHeight: 0,
        }}
      >
        <RemoteVideo
          stream={remoteStream}
          peerName={peerName}
          callStatus={callStatus}
          style={{ flex: 1 }}
        />

        <LocalVideo
          stream={localStream}
          isVideoOff={isVideoOff}
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '100px',
            height: '140px',
          }}
        />
      </div>

      <CallControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEndCall={handleEnd}
        disabled={callStatus === CALL_STATUS.ENDED}
      />
    </div>
  );
}
