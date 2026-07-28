import React from 'react';

export default function TypingAnimation() {
  const dotStyle = {
    width: '6px',
    height: '6px',
    backgroundColor: '#8696a0',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'waBounce 1.4s infinite ease-in-out both'
  };

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', backgroundColor: '#202c33', borderRadius: '8px', width: 'max-content', borderTopLeftRadius: '0px' }}>
      <span style={{ ...dotStyle, animationDelay: '-0.32s' }}></span>
      <span style={{ ...dotStyle, animationDelay: '-0.16s' }}></span>
      <span style={dotStyle}></span>
      <style>{`
        @keyframes waBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}