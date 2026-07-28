/**
 * @deprecated Use SocketContext (src/context/SocketContext.jsx) instead.
 * Kept for backward compatibility during migration.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://novaconnect-uowz.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export function connectSocketWithAuth() {
  const token = localStorage.getItem('token');
  socket.auth = { token };
  if (!socket.connected) socket.connect();
}
