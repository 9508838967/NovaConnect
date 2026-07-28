import React from 'react';
import { MessageSquare, Users, Video, Phone } from 'lucide-react';

// Yahan dhyan se dekhiye: "export default function" hona chahiye
export default function BottomNavigation({ currentTab, setCurrentTab }) {
  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'groups', icon: Users, label: 'Groups' },
    { id: 'video-call', icon: Video, label: 'Video Call' },
    { id: 'calls', icon: Phone, label: 'Calls' },
  ];

  return (
    <footer style={{ height: '74px', backgroundColor: '#111b21', borderTop: '1px solid rgba(134,150,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: '8px', flexShrink: 0, zIndex: 10 }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => setCurrentTab(item.id)} 
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ padding: '4px 20px', borderRadius: '16px', transition: 'background-color 0.15s ease', backgroundColor: isActive ? '#103629' : 'transparent', color: isActive ? '#d8f4e2' : '#aebac1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{ fontSize: '12px', marginTop: '6px', fontWeight: isActive ? '700' : '500', color: isActive ? '#e9edef' : '#8696a0', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </footer>
  );
}