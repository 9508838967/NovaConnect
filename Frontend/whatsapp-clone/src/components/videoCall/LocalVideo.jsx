/**
 * Local camera preview (picture-in-picture).
 * Dependencies: react
 */
import { useEffect, useRef } from 'react';

export default function LocalVideo({ stream, isVideoOff, className = '', style = {} }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
  }, [stream]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: '#111b21',
        border: '2px solid rgba(255,255,255,0.15)',
        ...style,
      }}
    >
      {!stream || isVideoOff ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8696a0',
            fontSize: '12px',
          }}
        >
          Camera off
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
      )}
    </div>
  );
}
