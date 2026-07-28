import React, { useState, useEffect } from 'react';
import ChatDashboard from './pages/ChatDashboard';
import GroupChat from './pages/GroupChat';
import VideoCallPage from './pages/VideoCallPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BottomNavigation from './components/BottomNavigation';
import { SocketProvider } from './context/SocketContext.jsx';
import { CallProvider, useCall } from './context/CallContext.jsx';

function AuthenticatedApp({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('chats');
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const { initiateCall } = useCall();

  const handleTriggerCall = async (contact) => {
    if (!contact?.id) {
      alert('Select a chat with a valid user to start a video call.');
      return;
    }
    try {
      await initiateCall({
        calleeId: contact.id,
        calleeName: contact.name || 'User',
        callType: 'video',
      });
    } catch (err) {
      alert(err.message || 'Could not start call');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '440px', height: '100%', backgroundColor: '#111b21', color: '#e9edef', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {currentTab === 'chats' && (
          <ChatDashboard
            onTriggerCall={handleTriggerCall}
            onOpenSettings={() => setShowSettingsOverlay(true)}
          />
        )}

        {currentTab === 'groups' && <GroupChat />}

        {currentTab === 'calls' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <header style={{ padding: '16px', borderBottom: '1px solid rgba(134,150,160,0.1)', flexShrink: 0 }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1fa855' }}>Calls</h1>
            </header>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#8696a0' }}>
              <span>Call history will appear here.</span>
            </div>
          </div>
        )}

        {showSettingsOverlay && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111b21', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(134,150,160,0.1)', backgroundColor: '#202c33' }}>
              <button
                onClick={() => setShowSettingsOverlay(false)}
                style={{ background: 'none', border: 'none', color: '#e9edef', fontSize: '20px', cursor: 'pointer' }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500', color: '#e9edef' }}>Settings</h2>
            </header>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SettingsPage />
              <button
                onClick={onLogout}
                style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#ea0038', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '16px', fontWeight: '500', paddingLeft: '16px' }}
              >
                Log out
              </button>
            </div>
          </div>
        )}

        {/* Video call overlay — handles incoming modal + active call UI */}
        <VideoCallPage />

        <BottomNavigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setAuthView('login');
  };

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onLoginSuccess={handleLoginSuccess} setView={setAuthView} />
    ) : (
      <Signup setView={setAuthView} />
    );
  }

  return (
    <SocketProvider isAuthenticated={isAuthenticated}>
      <CallProvider>
        <AuthenticatedApp onLogout={handleLogout} />
      </CallProvider>
    </SocketProvider>
  );
}
