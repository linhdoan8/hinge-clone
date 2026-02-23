'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  emitSendMessage,
  emitTypingStart,
  emitTypingStop,
  emitReadMessage,
  joinMatchRoom,
  leaveMatchRoom,
} from '@/lib/socket';
import { useAuthStore, useMatchesStore, useNotificationStore, type Message } from '@/lib/store';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const addMessage = useMatchesStore((s) => s.addMessage);
  const markMessageRead = useMatchesStore((s) => s.markMessageRead);
  const setTyping = useMatchesStore((s) => s.setTyping);
  const addMatch = useMatchesStore((s) => s.addMatch);
  const updateMatchLastMessage = useMatchesStore((s) => s.updateMatchLastMessage);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = connectSocket();
      socketRef.current = socket;

      socket.on('message:new', (data) => {
        const message: Message = {
          id: data.message.id,
          matchId: data.matchId,
          senderId: data.message.senderId,
          content: data.message.content,
          type: data.message.type,
          createdAt: data.message.createdAt,
        };
        addMessage(data.matchId, message);
        updateMatchLastMessage(data.matchId, message);
      });

      socket.on('message:read', (data) => {
        markMessageRead(data.matchId, data.messageId, data.readAt);
      });

      socket.on('typing:start', (data) => {
        if (data.userId !== user.id) {
          setTyping(data.matchId, true);
        }
      });

      socket.on('typing:stop', (data) => {
        if (data.userId !== user.id) {
          setTyping(data.matchId, false);
        }
      });

      socket.on('match:new', (data) => {
        addMatch({
          id: data.matchId,
          user: {
            id: data.user.id,
            firstName: data.user.firstName,
            photos: data.user.photos,
          },
          matchedAt: new Date().toISOString(),
          isActive: true,
          unreadCount: 0,
          isYourTurn: true,
        });
      });

      socket.on('notification:new', (data) => {
        addNotification({
          id: data.id,
          type: data.type,
          title: data.title,
          body: data.body,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });

      return () => {
        socket.off('message:new');
        socket.off('message:read');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('match:new');
        socket.off('notification:new');
        disconnectSocket();
        socketRef.current = null;
      };
    }
  }, [
    isAuthenticated,
    user,
    addMessage,
    markMessageRead,
    setTyping,
    addMatch,
    updateMatchLastMessage,
    addNotification,
  ]);

  const sendMessage = useCallback(
    (matchId: string, content: string, type: 'TEXT' | 'IMAGE' | 'GIF' = 'TEXT') => {
      emitSendMessage(matchId, content, type);
    },
    []
  );

  const startTyping = useCallback((matchId: string) => {
    emitTypingStart(matchId);
  }, []);

  const stopTyping = useCallback((matchId: string) => {
    emitTypingStop(matchId);
  }, []);

  const readMessage = useCallback((matchId: string, messageId: string) => {
    emitReadMessage(matchId, messageId);
  }, []);

  const joinRoom = useCallback((matchId: string) => {
    joinMatchRoom(matchId);
  }, []);

  const leaveRoom = useCallback((matchId: string) => {
    leaveMatchRoom(matchId);
  }, []);

  return {
    socket: socketRef.current,
    sendMessage,
    startTyping,
    stopTyping,
    readMessage,
    joinRoom,
    leaveRoom,
    isConnected: !!socketRef.current?.connected,
  };
}
