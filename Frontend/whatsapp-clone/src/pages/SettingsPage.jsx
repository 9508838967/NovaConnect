import React from 'react';
import { Key, Shield, Bell, HelpCircle, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const settingsList = [
    { icon: Key, title: 'Account', desc: 'Security notifications, change number' },
    { icon: Shield, title: 'Privacy', desc: 'Block contacts, disappearing messages' },
    { icon: Bell, title: 'Notifications', desc: 'Message, group & call tones' },
    { icon: HelpCircle, title: 'Help', desc: 'Help center, contact us, privacy policy' }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#111b21' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {settingsList.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '20px', cursor: 'pointer' }}>
              <Icon size={22} style={{ color: '#8696a0' }} />
              <div style={{ flex: 1, borderBottom: '1px solid rgba(134,150,160,0.1)', paddingBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#e9edef' }}>{item.title}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8696a0' }}>{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}