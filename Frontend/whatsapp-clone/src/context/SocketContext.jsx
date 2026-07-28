/**
 * Authenticated Socket.io client — single connection shared app-wide.
 *
 * Dependencies: socket.io-client (already in package.json)
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://novaconnect-uowz.onrender.com';

const SocketContext = createContext(null);

export function SocketProvider({ children, isAuthenticated }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      const userId = localStorage.getItem('userId');
      if (userId) {
        socket.emit('join:user', userId);
      }
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const onConnectError = (err) => {
      setConnectionError(err.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const getSocket = useCallback(() => socketRef.current, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      getSocket,
      isConnected,
      connectionError,
    }),
    [getSocket, isConnected, connectionError]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** @returns {{ socket: import('socket.io-client').Socket|null, getSocket: Function, isConnected: boolean, connectionError: string|null }} */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return ctx;
}

export default SocketContext;
