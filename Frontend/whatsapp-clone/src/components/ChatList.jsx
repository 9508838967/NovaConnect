import React from 'react';
import { CheckCheck, Users } from 'lucide-react';

export default function ChatList({ chats, onSelectChat }) {
  if (!chats || chats.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8696a0', padding: '0 32px', textAlign: 'center', fontSize: '14px' }}>
        <p style={{ margin: '0 0 8px 0' }}>No active conversations available.</p>
        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>Click the floating message button down below to start a chat thread.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {chats.map((chat) => {
        const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        return (
          <div 
            key={chat.id} 
            onClick={() => onSelectChat(chat)}
            style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', gap: '16px', position: 'relative' }}
            className="hover:bg-[#202c33]"
          >
            {/* Dynamic Profile/Group Avatar and Online Presence Indicator Node */}
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: chat.isGroup ? '#005c4b' : '#2a3942', color: '#1fa855', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0, position: 'relative' }}>
              {chat.isGroup ? <Users size={22} style={{ color: '#e9edef' }} /> : chat.name.slice(0, 2).toUpperCase()}
              
              {/* Presence status dot element from presence.js */}
              {!chat.isGroup && chat.isOnline && (
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', backgroundColor: '#1fa855', borderRadius: '50%', border: '2px solid #111b21' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, borderBottom: '1px solid rgba(134,150,160,0.15)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#e9edef' }}>{chat.name}</h3>
                <span style={{ fontSize: '12px', color: '#8696a0' }}>{lastMsg ? lastMsg.time : 'Now'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', height: '20px' }}>
                {/* Typing handler state preview line mapping string */}
                <p style={{ margin: 0, fontSize: '14px', color: chat.isTyping ? '#1fa855' : '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '8px', fontStyle: chat.isTyping ? 'italic' : 'normal' }}>
                  {chat.isTyping ? 'typing...' : (lastMsg ? lastMsg.text : 'No messages recorded')}
                </p>
                {chat.unreadCount > 0 && (
                  <span style={{ minWidth: '20px', height: '20px', padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1fa855', color: 'white', fontWeight: 'bold', fontSize: '11px', borderRadius: '50%' }}>
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}