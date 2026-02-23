'use client';

import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  gender?: string;
  genderPreference?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  hometown?: string;
  height?: number;
  religion?: string;
  politics?: string;
  drinking?: string;
  smoking?: string;
  drugs?: string;
  familyPlans?: string;
  latitude?: number;
  longitude?: number;
  isVerified?: boolean;
  isActive?: boolean;
  isPaused?: boolean;
  profileComplete?: boolean;
  photos: Photo[];
  prompts: UserPrompt[];
}

export interface Photo {
  id: string;
  url: string;
  position: number;
}

export interface UserPrompt {
  id: string;
  promptTemplateId: string;
  promptText?: string;
  answer: string;
  position: number;
}

export interface DiscoverProfile {
  id: string;
  firstName: string;
  age: number;
  location?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  height?: number;
  hometown?: string;
  religion?: string;
  politics?: string;
  drinking?: string;
  smoking?: string;
  photos: Photo[];
  prompts: (UserPrompt & { promptText: string })[];
  isMostCompatible?: boolean;
  compatibilityScore?: number;
}

export interface Like {
  id: string;
  fromUser: {
    id: string;
    firstName: string;
    age: number;
    photos: Photo[];
    jobTitle?: string;
  };
  targetType: 'PHOTO' | 'PROMPT';
  targetId: string;
  targetContent?: string;
  comment?: string;
  isRose: boolean;
  createdAt: string;
}

export interface Match {
  id: string;
  user: {
    id: string;
    firstName: string;
    photos: Photo[];
    jobTitle?: string;
    isOnline?: boolean;
    lastActiveAt?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    readAt?: string;
  };
  matchedAt: string;
  isActive: boolean;
  unreadCount: number;
  isYourTurn: boolean;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'GIF' | 'SYSTEM';
  readAt?: string;
  createdAt: string;
  reactions?: { id: string; userId: string; emoji: string }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

interface DiscoverState {
  profiles: DiscoverProfile[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  setProfiles: (profiles: DiscoverProfile[]) => void;
  addProfiles: (profiles: DiscoverProfile[]) => void;
  nextProfile: () => void;
  setLoading: (value: boolean) => void;
  setHasMore: (value: boolean) => void;
}

interface LikesState {
  likes: Like[];
  isLoading: boolean;
  setLikes: (likes: Like[]) => void;
  removeLike: (likeId: string) => void;
  setLoading: (value: boolean) => void;
}

interface MatchesState {
  matches: Match[];
  activeMatchId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, boolean>;
  isLoading: boolean;
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  setActiveMatch: (matchId: string | null) => void;
  setMessages: (matchId: string, messages: Message[]) => void;
  addMessage: (matchId: string, message: Message) => void;
  markMessageRead: (matchId: string, messageId: string, readAt: string) => void;
  setTyping: (matchId: string, isTyping: boolean) => void;
  updateMatchLastMessage: (matchId: string, message: Message) => void;
  setLoading: (value: boolean) => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
  login: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));

export const useDiscoverStore = create<DiscoverState>((set) => ({
  profiles: [],
  currentIndex: 0,
  isLoading: false,
  hasMore: true,
  setProfiles: (profiles) => set({ profiles, currentIndex: 0 }),
  addProfiles: (profiles) =>
    set((state) => ({ profiles: [...state.profiles, ...profiles] })),
  nextProfile: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
  setLoading: (value) => set({ isLoading: value }),
  setHasMore: (value) => set({ hasMore: value }),
}));

export const useLikesStore = create<LikesState>((set) => ({
  likes: [],
  isLoading: false,
  setLikes: (likes) => set({ likes }),
  removeLike: (likeId) =>
    set((state) => ({ likes: state.likes.filter((l) => l.id !== likeId) })),
  setLoading: (value) => set({ isLoading: value }),
}));

export const useMatchesStore = create<MatchesState>((set) => ({
  matches: [],
  activeMatchId: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((state) => ({ matches: [match, ...state.matches] })),
  setActiveMatch: (matchId) => set({ activeMatchId: matchId }),
  setMessages: (matchId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [matchId]: messages },
    })),
  addMessage: (matchId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: [...(state.messages[matchId] || []), message],
      },
    })),
  markMessageRead: (matchId, messageId, readAt) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: (state.messages[matchId] || []).map((m) =>
          m.id === messageId ? { ...m, readAt } : m
        ),
      },
    })),
  setTyping: (matchId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [matchId]: isTyping },
    })),
  updateMatchLastMessage: (matchId, message) =>
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessage: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt,
                readAt: message.readAt,
              },
            }
          : m
      ),
    })),
  setLoading: (value) => set({ isLoading: value }),
}));

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
