import React, { useState, useEffect } from 'react';
import { Camera, User, Info, Phone } from 'lucide-react';
import API from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: 'Loading...', about: '...', phone: '...' });

  useEffect(() => {
    API.get('/users/profile') // Backend endpoints metadata path routing structure matching core profile schemas
      .then(res => setProfile(res.data))
      .catch(err => console.error("Profile fetch failed:", err));
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#111b21' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid rgba(134,150,160,0.1)', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '500', color: '#e9edef' }}>Profile</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '24px' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8696a0', fontSize: '32px', fontWeight: 'bold' }}>
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: '#1fa855', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Camera size={18} />
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <User size={20} style={{ color: '#8696a0', marginTop: '4px' }} />
            <div style={{ flex: 1, borderBottom: '1px solid rgba(134,150,160,0.1)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#8696a0' }}>Name</span>
              <div style={{ fontSize: '16px', color: '#e9edef', marginTop: '4px', fontWeight: '500' }}>{profile.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <Info size={20} style={{ color: '#8696a0', marginTop: '4px' }} />
            <div style={{ flex: 1, borderBottom: '1px solid rgba(134,150,160,0.1)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#8696a0' }}>About</span>
              <div style={{ fontSize: '16px', color: '#e9edef', marginTop: '4px' }}>{profile.about}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}