/**
 * Remote participant full-screen video.
 * Dependencies: react
 */
import { useEffect, useRef } from 'react';

export default function RemoteVideo({ stream, peerName, callStatus, style = {} }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
  }, [stream]);

  const showPlaceholder = !stream;

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        position: 'relative',
        backgroundColor: '#1f2c34',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {showPlaceholder ? (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#1fa855',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 'bold',
              margin: '0 auto 16px',
            }}
          >
            {(peerName || '?').slice(0, 2).toUpperCase()}
          </div>
          <p style={{ color: '#8696a0', margin: 0, fontSize: '14px' }}>
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && 'Waiting for video...'}
            {!['ringing', 'connecting', 'connected'].includes(callStatus) && 'No video'}
          </p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
