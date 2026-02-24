'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ArrowLeft, Send, Loader2, Image as ImageIcon,
  MoreVertical, Phone, Video, Smile, Heart, X, Flag,
  UserX, CheckCheck, Clock, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  useMatchesStore, useAuthStore, type Match, type Message,
} from '@/lib/store';
import { cn, formatRelativeTime, formatMessageTime, formatChatDate, generatePlaceholderPhoto, generateAvatarUrl } from '@/lib/utils';
import ChatBubble, { TypingIndicator } from '@/components/ChatBubble';
import { useSocket } from '@/hooks/useSocket';

const DEMO_MATCHES: Match[] = [
  {
    id: 'm1',
    user: {
      id: 'u20',
      firstName: 'Sophia',
      photos: [{ id: 'mp1', url: generatePlaceholderPhoto(701), position: 1 }],
      jobTitle: 'Yoga Instructor',
      isOnline: true,
    },
    lastMessage: {
      id: 'msg1',
      content: 'That sounds amazing! I love hiking too.',
      senderId: 'u20',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    unreadCount: 1,
    isYourTurn: true,
  },
  {
    id: 'm2',
    user: {
      id: 'u21',
      firstName: 'Lily',
      photos: [{ id: 'mp2', url: generatePlaceholderPhoto(702), position: 1 }],
      jobTitle: 'Nurse',
      isOnline: false,
      lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    lastMessage: {
      id: 'msg2',
      content: 'Haha yes! We should totally try that place.',
      senderId: 'me',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    unreadCount: 0,
    isYourTurn: false,
  },
  {
    id: 'm3',
    user: {
      id: 'u22',
      firstName: 'Nora',
      photos: [{ id: 'mp3', url: generatePlaceholderPhoto(703), position: 1 }],
      jobTitle: 'Writer',
      isOnline: true,
    },
    lastMessage: undefined,
    matchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    unreadCount: 0,
    isYourTurn: true,
  },
  {
    id: 'm4',
    user: {
      id: 'u23',
      firstName: 'Isabella',
      photos: [{ id: 'mp4', url: generatePlaceholderPhoto(704), position: 1 }],
      jobTitle: 'Marketing',
      isOnline: false,
    },
    lastMessage: {
      id: 'msg3',
      content: 'Hey! Nice to match with you 😊',
      senderId: 'u23',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    matchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    unreadCount: 1,
    isYourTurn: true,
  },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  m1: [
    {
      id: 'msg-m1-1',
      matchId: 'm1',
      senderId: 'me',
      content: 'Hey Sophia! I noticed you liked my hiking photo. What are your favorite trails?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m1-2',
      matchId: 'm1',
      senderId: 'u20',
      content: 'Oh I love the Marin Headlands! Have you been to the Tennessee Valley trail?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m1-3',
      matchId: 'm1',
      senderId: 'me',
      content: 'Yes! The view from there is incredible. I usually go on Saturday mornings when it is less crowded.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m1-4',
      matchId: 'm1',
      senderId: 'u20',
      content: 'That sounds amazing! I love hiking too. Maybe we could go together sometime? 🥾',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ],
  m2: [
    {
      id: 'msg-m2-1',
      matchId: 'm2',
      senderId: 'u21',
      content: 'Hey! Love your taste in music. What was the last concert you went to?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m2-2',
      matchId: 'm2',
      senderId: 'me',
      content: 'Tame Impala at Chase Center! It was unreal. How about you?',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m2-3',
      matchId: 'm2',
      senderId: 'u21',
      content: 'No way! I was there too! Small world. I also went to Khruangbin last month at the Greek.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-m2-4',
      matchId: 'm2',
      senderId: 'me',
      content: 'Haha yes! We should totally try that place.',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  m4: [
    {
      id: 'msg-m4-1',
      matchId: 'm4',
      senderId: 'u23',
      content: 'Hey! Nice to match with you 😊',
      type: 'TEXT',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export default function MatchesPage() {
  const user = useAuthStore((s) => s.user);
  const {
    matches, activeMatchId, messages, typingUsers, isLoading,
    setMatches, setActiveMatch, setMessages, addMessage, setLoading,
  } = useMatchesStore();
  const { sendMessage, startTyping, stopTyping, readMessage, joinRoom, leaveRoom } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/matches');
      const apiData = response.data.data || response.data;
      const fetchedMatches = apiData.items || apiData;
      if (Array.isArray(fetchedMatches) && fetchedMatches.length > 0) {
        setMatches(fetchedMatches);
      } else {
        setMatches(DEMO_MATCHES);
      }
    } catch {
      setMatches(DEMO_MATCHES);
    } finally {
      setLoading(false);
    }
  }, [setMatches, setLoading]);

  const fetchMessages = useCallback(
    async (matchId: string) => {
      try {
        const response = await api.get(`/matches/${matchId}/messages`);
        const msgData = response.data.data || response.data;
        const fetchedMsgs = msgData.items || msgData;
        if (Array.isArray(fetchedMsgs) && fetchedMsgs.length > 0) {
          setMessages(matchId, fetchedMsgs);
        } else if (DEMO_MESSAGES[matchId]) {
          setMessages(matchId, DEMO_MESSAGES[matchId]);
        }
      } catch {
        if (DEMO_MESSAGES[matchId]) {
          setMessages(matchId, DEMO_MESSAGES[matchId]);
        } else {
          setMessages(matchId, []);
        }
      }
    },
    [setMessages]
  );

  useEffect(() => {
    if (matches.length === 0) {
      fetchMatches();
    }
  }, [fetchMatches, matches.length]);

  useEffect(() => {
    if (activeMatchId) {
      joinRoom(activeMatchId);
      if (!messages[activeMatchId]) {
        fetchMessages(activeMatchId);
      }
      return () => {
        leaveRoom(activeMatchId);
      };
    }
  }, [activeMatchId, joinRoom, leaveRoom, fetchMessages, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMatchId]);

  const activeMatch = matches.find((m) => m.id === activeMatchId);
  const activeMessages = activeMatchId ? messages[activeMatchId] || [] : [];
  const isTyping = activeMatchId ? typingUsers[activeMatchId] : false;

  const filteredMatches = matches.filter((m) =>
    m.user.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newMatches = filteredMatches.filter((m) => !m.lastMessage);
  const conversationMatches = filteredMatches.filter((m) => m.lastMessage);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeMatchId || !user) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      matchId: activeMatchId,
      senderId: user.id || 'me',
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    addMessage(activeMatchId, tempMessage);

    try {
      await api.post(`/matches/${activeMatchId}/messages`, {
        content,
        type: 'TEXT',
      });
      sendMessage(activeMatchId, content);
    } catch {
      // Message already added optimistically for demo
    } finally {
      setIsSending(false);
    }

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(activeMatchId);
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (activeMatchId) {
      startTyping(activeMatchId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (activeMatchId) stopTyping(activeMatchId);
      }, 2000);
    }
  };

  const shouldShowDateSeparator = (msg: Message, prevMsg?: Message): boolean => {
    if (!prevMsg) return true;
    const currDate = new Date(msg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currDate !== prevDate;
  };

  // Chat view
  if (activeMatch) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-4 py-3 glass border-b border-hinge-border/30 flex-shrink-0">
          <button
            onClick={() => setActiveMatch(null)}
            className="p-1.5 rounded-full hover:bg-hinge-surface-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-hinge-text-secondary" />
          </button>

          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={activeMatch.user.photos[0]?.url || generateAvatarUrl(activeMatch.user.firstName)}
              alt={activeMatch.user.firstName}
              fill
              className="object-cover"
            />
            {activeMatch.user.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-hinge-success border-2 border-hinge-surface" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-sm">{activeMatch.user.firstName}</h2>
            <p className="text-xs text-hinge-text-muted">
              {activeMatch.user.isOnline
                ? 'Online now'
                : activeMatch.user.lastActiveAt
                ? `Active ${formatRelativeTime(activeMatch.user.lastActiveAt)}`
                : 'Offline'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-hinge-surface-light transition-colors">
              <Phone className="w-4.5 h-4.5 text-hinge-text-secondary" />
            </button>
            <button className="p-2 rounded-full hover:bg-hinge-surface-light transition-colors">
              <Video className="w-4.5 h-4.5 text-hinge-text-secondary" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-hinge-surface-light transition-colors"
              >
                <MoreVertical className="w-4.5 h-4.5 text-hinge-text-secondary" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute top-full right-0 mt-1 w-48 py-2 rounded-xl bg-hinge-surface border border-hinge-border shadow-card z-50"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast.success('Report submitted');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hinge-surface-light transition-colors text-hinge-text-secondary"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast.success('User blocked');
                        setActiveMatch(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hinge-surface-light transition-colors text-hinge-danger"
                    >
                      <UserX className="w-4 h-4" />
                      Block & Unmatch
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Match system message */}
          <div className="flex justify-center py-4 mb-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-hinge-primary/30">
                <Image
                  src={activeMatch.user.photos[0]?.url || generateAvatarUrl(activeMatch.user.firstName)}
                  alt={activeMatch.user.firstName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="text-sm text-hinge-text-secondary">
                You matched with <span className="font-semibold text-white">{activeMatch.user.firstName}</span>
              </p>
              <p className="text-xs text-hinge-text-muted mt-0.5">
                {formatRelativeTime(activeMatch.matchedAt)}
              </p>
            </div>
          </div>

          {activeMessages.map((msg, index) => {
            const prevMsg = index > 0 ? activeMessages[index - 1] : undefined;
            const nextMsg = index < activeMessages.length - 1 ? activeMessages[index + 1] : undefined;
            const showDate = shouldShowDateSeparator(msg, prevMsg);
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
            const isSent = msg.senderId === (user?.id || 'me');

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center py-3">
                    <span className="text-xs text-hinge-text-muted bg-hinge-surface px-3 py-1 rounded-full">
                      {formatChatDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                <ChatBubble
                  message={msg}
                  isSent={isSent}
                  isLastInGroup={isLastInGroup}
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && <TypingIndicator userName={activeMatch.user.firstName} />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-hinge-border/30 bg-hinge-dark">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-full hover:bg-hinge-surface-light transition-colors flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-hinge-text-muted" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={messageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="input-field py-2.5 pr-12 min-h-[42px] max-h-32 resize-none text-sm"
                rows={1}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Smile className="w-5 h-5 text-hinge-text-muted hover:text-hinge-accent transition-colors" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!messageInput.trim() || isSending}
              className={cn(
                'p-2.5 rounded-full flex-shrink-0 transition-all',
                messageInput.trim()
                  ? 'bg-hinge-primary text-white shadow-button'
                  : 'bg-hinge-surface text-hinge-text-muted'
              )}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Match list view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-hinge-primary" />
              <h1 className="text-lg font-bold">Matches</h1>
            </div>
            <span className="text-sm text-hinge-text-secondary font-medium">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hinge-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches..."
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-2">
        {/* Loading */}
        {isLoading && matches.length === 0 && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 rounded-full shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 shimmer rounded" />
                  <div className="h-3 w-48 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New matches (no messages yet) */}
        {newMatches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-hinge-text-muted uppercase tracking-wider mb-3 px-1">
              New Matches
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {newMatches.map((match) => (
                <motion.button
                  key={match.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveMatch(match.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-hinge-primary">
                    <Image
                      src={match.user.photos[0]?.url || generateAvatarUrl(match.user.firstName)}
                      alt={match.user.firstName}
                      fill
                      className="object-cover"
                    />
                    {match.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-hinge-success border-2 border-hinge-dark" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-hinge-text-secondary">
                    {match.user.firstName}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        {conversationMatches.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-hinge-text-muted uppercase tracking-wider mb-2 px-1">
              Messages
            </h2>
            <div className="space-y-1">
              {conversationMatches.map((match) => (
                <MatchListItem
                  key={match.id}
                  match={match}
                  currentUserId={user?.id || 'me'}
                  onClick={() => setActiveMatch(match.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && matches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-20 h-20 rounded-full bg-hinge-surface flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-hinge-text-muted" />
            </div>
            <h2 className="text-xl font-bold mb-2">No matches yet</h2>
            <p className="text-hinge-text-secondary mb-6 max-w-xs">
              Keep liking profiles to get your first match. It only takes one!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MatchListItem({
  match,
  currentUserId,
  onClick,
}: {
  match: Match;
  currentUserId: string;
  onClick: () => void;
}) {
  const isSentByMe = match.lastMessage?.senderId === currentUserId || match.lastMessage?.senderId === 'me';

  return (
    <motion.button
      whileHover={{ backgroundColor: 'rgba(30, 42, 74, 0.5)' }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
    >
      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
        <Image
          src={match.user.photos[0]?.url || generateAvatarUrl(match.user.firstName)}
          alt={match.user.firstName}
          fill
          className="object-cover"
        />
        {match.user.isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-hinge-success border-2 border-hinge-dark" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn('font-semibold text-sm', match.unreadCount > 0 ? 'text-white' : 'text-hinge-text-secondary')}>
            {match.user.firstName}
          </h3>
          {match.lastMessage && (
            <span className="text-[10px] text-hinge-text-muted flex-shrink-0 ml-2">
              {formatRelativeTime(match.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {match.isYourTurn && match.unreadCount > 0 && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-hinge-primary" />
          )}
          {isSentByMe && (
            <span className="flex-shrink-0 text-hinge-text-muted">
              {match.lastMessage?.readAt ? (
                <CheckCheck className="w-3.5 h-3.5 text-hinge-primary" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
            </span>
          )}
          <p
            className={cn(
              'text-sm truncate',
              match.unreadCount > 0 ? 'text-white font-medium' : 'text-hinge-text-muted'
            )}
          >
            {match.lastMessage?.content || 'New match! Say hello.'}
          </p>
        </div>
      </div>

      {/* Your Turn badge or unread count */}
      <div className="flex-shrink-0">
        {match.isYourTurn && match.unreadCount > 0 ? (
          <span className="badge-primary text-[10px] font-semibold">
            <Clock className="w-3 h-3 mr-1" />
            Your turn
          </span>
        ) : match.unreadCount > 0 ? (
          <span className="w-5 h-5 rounded-full bg-hinge-primary text-white text-[10px] font-bold flex items-center justify-center">
            {match.unreadCount}
          </span>
        ) : null}
      </div>
    </motion.button>
  );
}
