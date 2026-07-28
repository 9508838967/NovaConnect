import React from 'react';
import { CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, currentUserId }) {
  // 1. Agar backend se isMe aaraha hai to wo use hoga, 
  // nahi to sender/senderId ko currentUserId se check karenge.
  const senderId = message.senderId || message.sender?._id || message.sender;
  
  const isMe = message.isMe !== undefined 
    ? message.isMe 
    : (senderId === currentUserId || senderId === localStorage.getItem("userId")); 

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
      <div style={{
        maxWidth: '75%',
        padding: '6px 12px 20px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
        position: 'relative',
        wordBreak: 'break-word',
        backgroundColor: isMe ? '#005c4b' : '#202c33', // Right (Green) for Me, Left (Dark Gray) for Receiver
        color: '#e9edef',
        borderTopRightRadius: isMe ? '0px' : '8px',
        borderTopLeftRadius: isMe ? '8px' : '0px'
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.text || message.content || message.message}</p>
        <div style={{ position: 'absolute', bottom: '2px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#8696a0', fontWeight: '500' }}>
            {message.time || (message.createdAt && new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
          </span>
          {isMe && (
            <CheckCheck size={14} style={{ color: message.status === 'read' ? '#53bdeb' : '#8696a0' }} />
          )}
        </div>
      </div>
    </div>
  );
}