import React from 'react';
import { Image, FileText, Camera, User } from 'lucide-react';

export default function FileUpload({ onClose }) {
  const items = [
    { icon: FileText, label: 'Document', color: '#7f66ff' },
    { icon: Image, label: 'Gallery', color: '#007aff' },
    { icon: Camera, label: 'Camera', color: '#ff2d55' },
    { icon: User, label: 'Contact', color: '#00c7be' }
  ];

  return (
    <div style={{ position: 'absolute', bottom: '68px', left: '52px', backgroundColor: '#233138', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={onClose}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: '#e9edef', fontSize: '14px', cursor: 'pointer', width: '160px', textAlign: 'left', borderRadius: '6px' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a3942'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Icon size={16} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}