/**
 * Incoming call overlay with accept / reject actions.
 * Dependencies: react, lucide-react
 */
import { Phone, PhoneOff, Video } from 'lucide-react';

export default function IncomingCallModal({ caller, callType, onAccept, onReject }) {
  if (!caller) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#1fa855',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '20px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        {(caller.username || 'U').slice(0, 2).toUpperCase()}
      </div>

      <h2 style={{ color: '#e9edef', margin: '0 0 8px', fontSize: '22px', fontWeight: 600 }}>
        {caller.username || 'Unknown'}
      </h2>

      <p
        style={{
          color: '#8696a0',
          margin: '0 0 40px',
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Video size={16} />
        Incoming {callType === 'audio' ? 'voice' : 'video'} call...
      </p>

      <div style={{ display: 'flex', gap: '48px' }}>
        <button
          type="button"
          aria-label="Reject call"
          onClick={onReject}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#ea0038',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOff size={28} />
        </button>

        <button
          type="button"
          aria-label="Accept call"
          onClick={(e) => {
            if (e && typeof e.preventDefault === 'function') {
              e.preventDefault();
            }
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            if (onAccept) {
              onAccept(e);
            }
          }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#1fa855',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Phone size={28} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(31,168,85,0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(31,168,85,0); }
        }
      `}</style>
    </div>
  );
}
