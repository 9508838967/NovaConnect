import React from 'react';

const EMOJIS = ['😀', '😂', '🔥', '👍', '❤️', '🙏', '🎉', '💡', '🚀', '💯', '👏', '😮'];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <div style={{ position: 'absolute', bottom: '68px', left: '12px', backgroundColor: '#233138', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 100, width: '260px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', justifyItems: 'center' }}>
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}