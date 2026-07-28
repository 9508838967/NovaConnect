import React from 'react';
import { Video, Mic, PhoneOff, ShieldAlert } from 'lucide-react';

export default function VideoCallScreen({ contactName, onEndCall }) {
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0b141a', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1fa855', fontSize: '12px', backgroundColor: 'rgba(31,168,85,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
          <ShieldAlert size={12} />
          <span>End-to-end encrypted</span>
        </div>
        <h2 style={{ margin: '12px 0 0 0', fontSize: '22px', color: '#e9edef', fontWeight: '600' }}>{contactName || 'Call'}</h2>
        <span style={{ fontSize: '14px', color: '#8696a0' }}>Ringing...</span>
      </div>

      <div style={{ flex: 1, width: '100%', margin: '24px 0', backgroundColor: '#1f2c34', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#1fa855', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold' }}>
          {(contactName || 'VC').slice(0,2).toUpperCase()}
        </div>
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '90px', height: '140px', backgroundColor: '#111b21', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
        <button style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#2a3942', border: 'none', color: '#e9edef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={20} /></button>
        <button onClick={onEndCall} style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#ea0038', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneOff size={22} /></button>
        <button style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#2a3942', border: 'none', color: '#e9edef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={20} /></button>
      </div>
    </div>
  );
}