import React, { useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export default function VoiceMessage({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isMe = message.isMe;

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '240px',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: isMe ? '#005c4b' : '#202c33',
        color: '#e9edef',
        borderTopRightRadius: isMe ? '0px' : '8px',
        borderTopLeftRadius: isMe ? '8px' : '0px'
      }}>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ background: 'none', border: 'none', color: '#e9edef', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ height: '3px', backgroundColor: 'rgba(233,237,239,0.2)', borderRadius: '2px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: isPlaying ? '100%' : '30%', backgroundColor: '#1fa855', borderRadius: '2px', transition: 'width 5s linear' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#8696a0' }}>{message.duration || '0:00'}</span>
        </div>
        
        <div style={{ fontSize: '10px', color: '#8696a0', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
          <Mic size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {message.time}
        </div>
      </div>
    </div>
  );
}