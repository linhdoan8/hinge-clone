'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, X, MapPin, Briefcase, GraduationCap, Ruler,
  ChevronUp, ChevronDown, MessageCircle, Sparkles, Star,
} from 'lucide-react';
import { cn, getHeightDisplay, formatEnumLabel } from '@/lib/utils';
import type { DiscoverProfile } from '@/lib/store';

interface ProfileCardProps {
  profile: DiscoverProfile;
  onLike: (targetType: 'PHOTO' | 'PROMPT', targetId: string, comment?: string) => void;
  onSkip: () => void;
  isAnimatingOut?: 'like' | 'skip' | null;
}

export default function ProfileCard({
  profile,
  onLike,
  onSkip,
  isAnimatingOut,
}: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [likeTarget, setLikeTarget] = useState<{
    type: 'PHOTO' | 'PROMPT';
    id: string;
  } | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePhotoNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handleLikeContent = (type: 'PHOTO' | 'PROMPT', id: string) => {
    setHeartAnimation(id);
    setTimeout(() => setHeartAnimation(null), 600);
    setLikeTarget({ type, id });
    setShowCommentInput(true);
  };

  const handleSendLike = () => {
    if (likeTarget) {
      onLike(likeTarget.type, likeTarget.id, comment.trim() || undefined);
      setComment('');
      setShowCommentInput(false);
      setLikeTarget(null);
    }
  };

  const handleQuickLike = () => {
    const firstPhoto = profile.photos[0];
    if (firstPhoto) {
      onLike('PHOTO', firstPhoto.id);
    }
  };

  const badges = [
    profile.religion && formatEnumLabel(profile.religion),
    profile.politics && formatEnumLabel(profile.politics),
    profile.drinking && `Drinking: ${formatEnumLabel(profile.drinking)}`,
    profile.smoking && `Smoking: ${formatEnumLabel(profile.smoking)}`,
  ].filter(Boolean);

  return (
    <motion.div
      className={cn(
        'profile-card w-full max-w-lg mx-auto',
        isAnimatingOut === 'like' && 'card-exit-right',
        isAnimatingOut === 'skip' && 'card-exit-left'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Most Compatible badge */}
      {profile.isMostCompatible && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-hinge">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white">Most Compatible</span>
        </div>
      )}

      <div ref={scrollRef} className="overflow-y-auto max-h-[75vh] hide-scrollbar">
        {/* Photo section */}
        <div className="relative aspect-[3/4] bg-hinge-surface-light">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhotoIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              {profile.photos[currentPhotoIndex] && (
                <Image
                  src={profile.photos[currentPhotoIndex].url}
                  alt={`${profile.firstName}'s photo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority={currentPhotoIndex === 0}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Photo navigation tap areas */}
          <div className="absolute inset-0 flex z-10">
            <button
              className="w-1/3 h-full"
              onClick={() => handlePhotoNav('prev')}
              aria-label="Previous photo"
            />
            <div className="w-1/3" />
            <button
              className="w-1/3 h-full"
              onClick={() => handlePhotoNav('next')}
              aria-label="Next photo"
            />
          </div>

          {/* Photo indicators */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {profile.photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-200',
                  i === currentPhotoIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/40'
                )}
              />
            ))}
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-card z-10" />

          {/* Profile info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <h2 className="text-2xl font-bold text-white">
              {profile.firstName}, {profile.age}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-white/80">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.location}
                </span>
              )}
              {profile.height && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5" />
                  {getHeightDisplay(profile.height)}
                </span>
              )}
            </div>
            {(profile.jobTitle || profile.school) && (
              <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                {profile.jobTitle && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {profile.jobTitle}
                    {profile.company && ` at ${profile.company}`}
                  </span>
                )}
                {profile.school && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {profile.school}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Like button on photo */}
          <button
            onClick={() => {
              const photo = profile.photos[currentPhotoIndex];
              if (photo) handleLikeContent('PHOTO', photo.id);
            }}
            className="absolute bottom-5 right-5 z-20 like-button w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-hinge-secondary/80"
          >
            <Heart
              className={cn(
                'w-6 h-6 text-white',
                heartAnimation === profile.photos[currentPhotoIndex]?.id && 'like-button-pulse'
              )}
              fill={heartAnimation === profile.photos[currentPhotoIndex]?.id ? 'currentColor' : 'none'}
            />
          </button>

          {/* Heart animation overlay */}
          <AnimatePresence>
            {heartAnimation === profile.photos[currentPhotoIndex]?.id && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
              >
                <Heart className="w-24 h-24 text-hinge-secondary" fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prompts section */}
        <div className="p-5 space-y-4">
          {profile.prompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              className="relative p-5 rounded-2xl bg-hinge-surface-light border border-hinge-border group"
              whileHover={{ scale: 1.01 }}
            >
              <p className="text-sm font-medium text-hinge-primary mb-2">
                {prompt.promptText}
              </p>
              <p className="text-lg text-white leading-relaxed">{prompt.answer}</p>

              {/* Like button on prompt */}
              <button
                onClick={() => handleLikeContent('PROMPT', prompt.id)}
                className={cn(
                  'absolute bottom-4 right-4 like-button w-10 h-10 bg-hinge-surface border border-hinge-border',
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
              >
                <Heart
                  className={cn(
                    'w-5 h-5 text-hinge-secondary',
                    heartAnimation === prompt.id && 'like-button-pulse'
                  )}
                  fill={heartAnimation === prompt.id ? 'currentColor' : 'none'}
                />
              </button>

              {/* Heart animation overlay for prompt */}
              <AnimatePresence>
                {heartAnimation === prompt.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  >
                    <Heart className="w-16 h-16 text-hinge-secondary" fill="currentColor" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Additional photos */}
          {profile.photos.slice(1).map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-hinge-surface-light group"
            >
              <Image
                src={photo.url}
                alt={`${profile.firstName}'s photo ${index + 2}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
              <button
                onClick={() => handleLikeContent('PHOTO', photo.id)}
                className={cn(
                  'absolute bottom-4 right-4 like-button w-10 h-10 bg-black/30 backdrop-blur-sm border border-white/20',
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
              >
                <Heart
                  className={cn(
                    'w-5 h-5 text-white',
                    heartAnimation === photo.id && 'like-button-pulse'
                  )}
                  fill={heartAnimation === photo.id ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          ))}

          {/* Identity badges */}
          {badges.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, i) => (
                  <span key={i} className="badge-primary">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment input overlay */}
      <AnimatePresence>
        {showCommentInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 glass rounded-b-2xl z-30"
          >
            <p className="text-sm text-hinge-text-secondary mb-2">
              Add a comment with your like (optional)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Say something nice..."
                className="input-field flex-1 py-2.5 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendLike();
                  if (e.key === 'Escape') {
                    setShowCommentInput(false);
                    setLikeTarget(null);
                  }
                }}
              />
              <button
                onClick={handleSendLike}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                <Heart className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowCommentInput(false);
                setLikeTarget(null);
              }}
              className="w-full mt-2 text-center text-xs text-hinge-text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons (only shown when comment input is not visible) */}
      {!showCommentInput && (
        <div className="flex items-center justify-center gap-6 p-4 border-t border-hinge-border/50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSkip}
            className="like-button w-14 h-14 bg-hinge-surface border border-hinge-border hover:border-hinge-danger"
          >
            <X className="w-7 h-7 text-hinge-text-muted" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleQuickLike}
            className="like-button w-16 h-16 bg-gradient-hinge shadow-button"
          >
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
