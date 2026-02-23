import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

let socket: Socket | null = null;

export interface SocketEvents {
  'message:new': (data: {
    matchId: string;
    message: {
      id: string;
      senderId: string;
      content: string;
      type: 'TEXT' | 'IMAGE' | 'GIF' | 'SYSTEM';
      createdAt: string;
    };
  }) => void;
  'message:read': (data: { matchId: string; messageId: string; readAt: string }) => void;
  'typing:start': (data: { matchId: string; userId: string }) => void;
  'typing:stop': (data: { matchId: string; userId: string }) => void;
  'match:new': (data: {
    matchId: string;
    user: {
      id: string;
      firstName: string;
      photos: { url: string }[];
    };
  }) => void;
  'notification:new': (data: {
    id: string;
    type: string;
    title: string;
    body: string;
  }) => void;
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
}

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function emitTypingStart(matchId: string): void {
  socket?.emit('typing:start', { matchId });
}

export function emitTypingStop(matchId: string): void {
  socket?.emit('typing:stop', { matchId });
}

export function emitSendMessage(
  matchId: string,
  content: string,
  type: 'TEXT' | 'IMAGE' | 'GIF' = 'TEXT'
): void {
  socket?.emit('message:send', { matchId, content, type });
}

export function emitReadMessage(matchId: string, messageId: string): void {
  socket?.emit('message:read', { matchId, messageId });
}

export function joinMatchRoom(matchId: string): void {
  socket?.emit('match:join', { matchId });
}

export function leaveMatchRoom(matchId: string): void {
  socket?.emit('match:leave', { matchId });
}
