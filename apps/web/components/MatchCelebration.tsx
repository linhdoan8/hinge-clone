'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils';

interface MatchCelebrationProps {
  isVisible: boolean;
  currentUserName: string;
  currentUserPhoto?: string;
  matchedUserName: string;
  matchedUserPhoto?: string;
  onSendMessage: () => void;
  onKeepBrowsing: () => void;
}

const confettiColors = [
  '#6C47FF', '#FF6B6B', '#FFD166', '#22C55E', '#3B82F6', '#EC4899',
  '#F97316', '#8B5CF6', '#14B8A6', '#F43F5E',
];

function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const color = confettiColors[index % confettiColors.length];
  const left = `${Math.random() * 100}%`;
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="fixed top-0 pointer-events-none z-[110]"
      style={{
        left,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: rotation }}
      animate={{
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: rotation + 720,
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

export default function MatchCelebration({
  isVisible,
  currentUserName,
  currentUserPhoto,
  matchedUserName,
  matchedUserPhoto,
  onSendMessage,
  onKeepBrowsing,
}: MatchCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="match-overlay"
        >
          {/* Confetti */}
          {showConfetti &&
            [...Array(40)].map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.05} index={i} />
            ))}

          {/* Content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex flex-col items-center px-8 max-w-sm w-full"
          >
            {/* Floating hearts */}
            <div className="relative mb-6">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: (Math.random() - 0.5) * 80,
                    y: 0,
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    y: -100 - Math.random() * 100,
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.5 + i * 0.3,
                    repeat: 1,
                    repeatDelay: 0.5,
                  }}
                >
                  <Heart
                    className="w-5 h-5 text-hinge-secondary"
                    fill="currentColor"
                  />
                </motion.div>
              ))}

              {/* User photos */}
              <div className="flex items-center -space-x-6">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-hinge-primary shadow-glow z-10"
                >
                  <Image
                    src={currentUserPhoto || generateAvatarUrl(currentUserName)}
                    alt={currentUserName}
                    fill
                    className="object-cover"
                  />
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="relative z-20 -mx-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-hinge flex items-center justify-center shadow-glow">
                    <Heart className="w-6 h-6 text-white" fill="currentColor" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-hinge-secondary shadow-lg"
                >
                  <Image
                    src={matchedUserPhoto || generateAvatarUrl(matchedUserName)}
                    alt={matchedUserName}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </div>
            </div>

            {/* Match text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold gradient-text mb-2">
                It&apos;s a Match!
              </h2>
              <p className="text-hinge-text-secondary">
                You and {matchedUserName} liked each other
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full space-y-3"
            >
              <button
                onClick={onSendMessage}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Send a Message
              </button>
              <button
                onClick={onKeepBrowsing}
                className="w-full btn-ghost py-3 text-base"
              >
                Keep Browsing
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
