/**
 * Call state provider — wraps useWebRTC and exposes call API to the UI tree.
 *
 * Dependencies: react, ./SocketContext, ../hooks/useWebRTC
 */
import { createContext, useContext, useMemo } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useWebRTC } from '../hooks/useWebRTC.js';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { getSocket } = useSocket();
  const webrtc = useWebRTC(getSocket);

  const value = useMemo(() => webrtc, [webrtc]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

/** @returns {ReturnType<typeof useWebRTC>} */
export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within CallProvider');
  }
  return ctx;
}

export default CallContext;
