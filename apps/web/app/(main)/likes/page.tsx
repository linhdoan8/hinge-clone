'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, X, MessageCircle, Loader2, Sparkles, Flower2,
  ChevronRight, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useLikesStore, useAuthStore, type Like } from '@/lib/store';
import { cn, formatRelativeTime, generatePlaceholderPhoto } from '@/lib/utils';
import MatchCelebration from '@/components/MatchCelebration';

const DEMO_LIKES: Like[] = [
  {
    id: 'l1',
    fromUser: {
      id: 'u10',
      firstName: 'Alex',
      age: 27,
      photos: [{ id: 'lp1', url: generatePlaceholderPhoto(601), position: 1 }],
      jobTitle: 'Photographer',
    },
    targetType: 'PHOTO',
    targetId: 'p1',
    targetContent: undefined,
    comment: 'Love this photo! Where was it taken?',
    isRose: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'l2',
    fromUser: {
      id: 'u11',
      firstName: 'Jordan',
      age: 29,
      photos: [{ id: 'lp2', url: generatePlaceholderPhoto(602), position: 1 }],
      jobTitle: 'Chef',
    },
    targetType: 'PROMPT',
    targetId: 'pr1',
    targetContent: 'A shower thought I recently had',
    comment: 'That is such a good one - I think about this all the time!',
    isRose: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'l3',
    fromUser: {
      id: 'u12',
      firstName: 'Riley',
      age: 25,
      photos: [{ id: 'lp3', url: generatePlaceholderPhoto(603), position: 1 }],
      jobTitle: 'Musician',
    },
    targetType: 'PHOTO',
    targetId: 'p2',
    comment: undefined,
    isRose: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'l4',
    fromUser: {
      id: 'u13',
      firstName: 'Casey',
      age: 26,
      photos: [{ id: 'lp4', url: generatePlaceholderPhoto(604), position: 1 }],
      jobTitle: 'Marketing Manager',
    },
    targetType: 'PROMPT',
    targetId: 'pr2',
    targetContent: 'Dating me is like',
    comment: 'Haha I feel the exact same way!',
    isRose: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'l5',
    fromUser: {
      id: 'u14',
      firstName: 'Sam',
      age: 30,
      photos: [{ id: 'lp5', url: generatePlaceholderPhoto(605), position: 1 }],
      jobTitle: 'Architect',
    },
    targetType: 'PHOTO',
    targetId: 'p3',
    comment: 'Great smile!',
    isRose: false,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

export default function LikesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { likes, isLoading, setLikes, removeLike, setLoading } = useLikesStore();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLikes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/likes/received');
      const fetchedLikes = response.data.data || response.data;
      if (Array.isArray(fetchedLikes) && fetchedLikes.length > 0) {
        setLikes(fetchedLikes);
      } else {
        setLikes(DEMO_LIKES);
      }
    } catch {
      setLikes(DEMO_LIKES);
    } finally {
      setLoading(false);
    }
  }, [setLikes, setLoading]);

  useEffect(() => {
    if (likes.length === 0) {
      fetchLikes();
    }
  }, [fetchLikes, likes.length]);

  const handleLikeBack = async (like: Like) => {
    setRespondingId(like.id);
    try {
      await api.patch(`/likes/${like.id}/respond`, { action: 'LIKE' });
      setMatchedUser({
        name: like.fromUser.firstName,
        photo: like.fromUser.photos[0]?.url,
      });
      removeLike(like.id);
      setShowMatch(true);
    } catch {
      // Demo mode: simulate match
      setMatchedUser({
        name: like.fromUser.firstName,
        photo: like.fromUser.photos[0]?.url,
      });
      removeLike(like.id);
      setShowMatch(true);
    } finally {
      setRespondingId(null);
    }
  };

  const handleSkip = async (like: Like) => {
    setRespondingId(like.id);
    try {
      await api.patch(`/likes/${like.id}/respond`, { action: 'SKIP' });
    } catch {
      // Demo mode: just remove
    }
    removeLike(like.id);
    setRespondingId(null);
    toast('Skipped', { icon: '👋', duration: 1500 });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-hinge-secondary" fill="currentColor" />
            <h1 className="text-lg font-bold">Likes You</h1>
          </div>
          <span className="text-sm text-hinge-text-secondary font-medium">
            {likes.length} {likes.length === 1 ? 'like' : 'likes'}
          </span>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Loading */}
        {isLoading && likes.length === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-hinge-surface">
                <div className="aspect-[3/4] shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-20 shimmer rounded" />
                  <div className="h-3 w-32 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Likes grid */}
        {!isLoading && likes.length > 0 && (
          <div className="space-y-4">
            {/* Rose likes (premium) first */}
            {likes.some((l) => l.isRose) && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flower2 className="w-4 h-4 text-hinge-accent" />
                  <h2 className="text-sm font-semibold text-hinge-accent">Roses</h2>
                </div>
                <div className="space-y-3">
                  {likes
                    .filter((l) => l.isRose)
                    .map((like) => (
                      <LikeCard
                        key={like.id}
                        like={like}
                        isExpanded={expandedId === like.id}
                        isResponding={respondingId === like.id}
                        onToggleExpand={() =>
                          setExpandedId(expandedId === like.id ? null : like.id)
                        }
                        onLikeBack={() => handleLikeBack(like)}
                        onSkip={() => handleSkip(like)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Regular likes */}
            <div className="grid grid-cols-2 gap-3">
              {likes
                .filter((l) => !l.isRose)
                .map((like, index) => (
                  <motion.div
                    key={like.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <LikeGridCard
                      like={like}
                      isResponding={respondingId === like.id}
                      onLikeBack={() => handleLikeBack(like)}
                      onSkip={() => handleSkip(like)}
                    />
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && likes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-20 h-20 rounded-full bg-hinge-surface flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-hinge-text-muted" />
            </div>
            <h2 className="text-xl font-bold mb-2">No likes yet</h2>
            <p className="text-hinge-text-secondary mb-6 max-w-xs">
              Keep engaging with profiles in Discover. The more you interact, the more likes you&apos;ll receive.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Go to Discover
            </button>
          </motion.div>
        )}
      </div>

      {/* Match celebration */}
      <MatchCelebration
        isVisible={showMatch}
        currentUserName={user?.firstName || 'You'}
        currentUserPhoto={user?.photos?.[0]?.url}
        matchedUserName={matchedUser?.name || ''}
        matchedUserPhoto={matchedUser?.photo}
        onSendMessage={() => {
          setShowMatch(false);
          router.push('/matches');
        }}
        onKeepBrowsing={() => setShowMatch(false)}
      />
    </div>
  );
}

/* Rose / Featured like card (full width) */
function LikeCard({
  like,
  isExpanded,
  isResponding,
  onToggleExpand,
  onLikeBack,
  onSkip,
}: {
  like: Like;
  isExpanded: boolean;
  isResponding: boolean;
  onToggleExpand: () => void;
  onLikeBack: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden bg-hinge-surface border border-hinge-accent/30"
    >
      <button onClick={onToggleExpand} className="w-full text-left">
        <div className="flex items-center gap-4 p-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={like.fromUser.photos[0]?.url || ''}
              alt={like.fromUser.firstName}
              fill
              className="object-cover"
            />
            <div className="absolute top-1 right-1">
              <Flower2 className="w-4 h-4 text-hinge-accent" fill="currentColor" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">
                {like.fromUser.firstName}, {like.fromUser.age}
              </h3>
              <span className="badge-accent text-[10px]">Rose</span>
            </div>
            {like.fromUser.jobTitle && (
              <p className="text-sm text-hinge-text-secondary truncate">
                {like.fromUser.jobTitle}
              </p>
            )}
            <p className="text-xs text-hinge-text-muted mt-0.5">
              {like.targetType === 'PROMPT'
                ? `Liked your prompt: "${like.targetContent}"`
                : 'Liked your photo'}
            </p>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 text-hinge-text-muted transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-hinge-border/50 pt-3">
              {like.comment && (
                <div className="p-3 rounded-xl bg-hinge-surface-light mb-4">
                  <p className="text-sm text-hinge-text-secondary italic">
                    &ldquo;{like.comment}&rdquo;
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onSkip}
                  disabled={isResponding}
                  className="flex-1 btn-ghost border border-hinge-border py-2.5 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Skip
                </button>
                <button
                  onClick={onLikeBack}
                  disabled={isResponding}
                  className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
                >
                  {isResponding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" fill="currentColor" />
                  )}
                  Like Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Grid like card (half width) */
function LikeGridCard({
  like,
  isResponding,
  onLikeBack,
  onSkip,
}: {
  like: Like;
  isResponding: boolean;
  onLikeBack: () => void;
  onSkip: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden bg-hinge-surface border border-hinge-border hover:border-hinge-primary/30 transition-colors"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={like.fromUser.photos[0]?.url || ''}
          alt={like.fromUser.firstName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 250px"
        />
        <div className="absolute inset-0 bg-gradient-card" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm">
            {like.fromUser.firstName}, {like.fromUser.age}
          </h3>
          {like.fromUser.jobTitle && (
            <p className="text-xs text-white/70 truncate">{like.fromUser.jobTitle}</p>
          )}
        </div>

        {/* What they liked indicator */}
        <div className="absolute top-2 left-2 right-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm max-w-full">
            <Heart className="w-3 h-3 text-hinge-secondary flex-shrink-0" fill="currentColor" />
            <span className="text-[10px] text-white/80 truncate">
              {like.targetType === 'PROMPT'
                ? `"${like.targetContent}"`
                : 'your photo'}
            </span>
          </div>
        </div>

        {/* Comment badge */}
        {like.comment && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-hinge-primary flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Comment preview */}
      {like.comment && (
        <div className="px-3 py-2 border-t border-hinge-border/50">
          <p className="text-xs text-hinge-text-secondary italic truncate">
            &ldquo;{like.comment}&rdquo;
          </p>
        </div>
      )}

      {/* Action buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-hinge-border/50"
          >
            <div className="flex gap-2 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
                disabled={isResponding}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-hinge-surface-light hover:bg-hinge-surface-hover transition-colors text-xs font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Skip
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLikeBack();
                }}
                disabled={isResponding}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-hinge-primary hover:bg-hinge-primary/90 transition-colors text-xs font-medium"
              >
                {isResponding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Heart className="w-3.5 h-3.5" fill="currentColor" />
                )}
                Like
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-1.5">
        <p className="text-[10px] text-hinge-text-muted">
          {formatRelativeTime(like.createdAt)}
        </p>
      </div>
    </div>
  );
}
