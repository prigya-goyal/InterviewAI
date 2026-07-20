import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

// Lazily creates a single authenticated socket connection, reused across
// the app (primarily by the live AI Interview page).
export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('interviewai_token') || '';
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: false });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
