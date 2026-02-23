'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn, formatMessageTime } from '@/lib/utils';
import type { Message } from '@/lib/store';

interface ChatBubbleProps {
  message: Message;
  isSent: boolean;
  showTimestamp?: boolean;
  isLastInGroup?: boolean;
}

export default function ChatBubble({
  message,
  isSent,
  showTimestamp = true,
  isLastInGroup = true,
}: ChatBubbleProps) {
  if (message.type === 'SYSTEM') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-hinge-text-muted bg-hinge-surface px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex',
        isSent ? 'justify-end' : 'justify-start',
        !isLastInGroup ? 'mb-0.5' : 'mb-2'
      )}
    >
      <div className={cn('max-w-[80%] group')}>
        <div
          className={cn(
            isSent ? 'chat-bubble-sent' : 'chat-bubble-received',
            'relative'
          )}
        >
          {message.type === 'IMAGE' ? (
            <div className="rounded-xl overflow-hidden -m-1">
              <img
                src={message.content}
                alt="Shared image"
                className="max-w-full rounded-xl"
                style={{ maxHeight: 300 }}
              />
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp and read receipt */}
        {showTimestamp && isLastInGroup && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 px-1',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            <span className="text-[10px] text-hinge-text-muted">
              {formatMessageTime(message.createdAt)}
            </span>
            {isSent && (
              <span className="text-hinge-text-muted">
                {message.readAt ? (
                  <CheckCheck className="w-3.5 h-3.5 text-hinge-primary" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={cn(
              'flex gap-1 mt-0.5',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            {message.reactions.map((reaction) => (
              <span
                key={reaction.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-hinge-surface text-xs border border-hinge-border"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex justify-start mb-2"
    >
      <div className="chat-bubble-received flex items-center gap-1 py-3 px-4">
        <div className="typing-dot w-2 h-2 rounded-full bg-hinge-text-muted" />
        <div className="typing-dot w-2 h-2 rounded-full bg-hinge-text-muted" />
        <div className="typing-dot w-2 h-2 rounded-full bg-hinge-text-muted" />
      </div>
    </motion.div>
  );
}
