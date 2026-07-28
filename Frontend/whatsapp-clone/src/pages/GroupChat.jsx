import React, { useState, useEffect } from 'react';
import { Users, Camera, MoreVertical, Search } from 'lucide-react';
import API from '../services/api';

export default function GroupChat({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get('/groups'); // Backend standard API fetch router matching endpoint
        setGroups(res.data);
      } catch (err) {
        console.error("Groups load nahi ho paye:", err);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#111b21' }}>
      <header style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1fa855' }}>Groups</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#aebac1' }}>
          <Camera size={20} style={{ cursor: 'pointer' }} />
          <MoreVertical size={20} style={{ cursor: 'pointer' }} />
        </div>
      </header>

      <div style={{ padding: '8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#202c33', padding: '10px 16px', borderRadius: '24px' }}>
          <Search size={18} style={{ color: '#8696a0' }} />
          <input type="text" style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '15px', color: '#e9edef' }} placeholder="Search groups" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groups.map(group => (
          <div key={group._id} onClick={() => onSelectGroup(group)} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '16px', cursor: 'pointer' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#005c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9edef' }}>
              <Users size={24} />
            </div>
            <div style={{ flex: 1, borderBottom: '1px solid rgba(134,150,160,0.15)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#e9edef' }}>{group.name}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.description || 'Tap to join group discussion'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}