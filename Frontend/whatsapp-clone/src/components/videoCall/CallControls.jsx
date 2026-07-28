/**
 * In-call control bar — mute, camera, end call.
 * Dependencies: react, lucide-react
 */
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export default function CallControls({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  disabled = false,
}) {
  const btnBase = {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.15s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '16px 0 24px',
      }}
    >
      <button
        type="button"
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        onClick={onToggleMute}
        disabled={disabled}
        style={{
          ...btnBase,
          backgroundColor: isMuted ? '#ea0038' : '#2a3942',
          color: '#e9edef',
        }}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <button
        type="button"
        aria-label="End call"
        onClick={onEndCall}
        disabled={disabled}
        style={{
          ...btnBase,
          width: '58px',
          height: '58px',
          backgroundColor: '#ea0038',
          color: 'white',
        }}
      >
        <PhoneOff size={24} />
      </button>

      <button
        type="button"
        aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
        onClick={onToggleVideo}
        disabled={disabled}
        style={{
          ...btnBase,
          backgroundColor: isVideoOff ? '#ea0038' : '#2a3942',
          color: '#e9edef',
        }}
      >
        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
      </button>
    </div>
  );
}
