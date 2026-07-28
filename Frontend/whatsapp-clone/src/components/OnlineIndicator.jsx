import React from 'react';

export default function OnlineIndicator({ isOnline }) {
  return (
    <div style={{
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: isOnline ? '#1fa855' : '#8696a0',
      border: '2px solid #111b21',
      display: 'inline-block'
    }} />
  );
}