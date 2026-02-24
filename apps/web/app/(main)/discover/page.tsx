'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, Frown, RefreshCw, Sparkles, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useDiscoverStore, useAuthStore, type DiscoverProfile } from '@/lib/store';
import { generatePlaceholderPhoto } from '@/lib/utils';
import ProfileCard from '@/components/ProfileCard';
import MatchCelebration from '@/components/MatchCelebration';

// Demo profiles for when the API is not available
const DEMO_PROFILES: DiscoverProfile[] = [
  {
    id: '1',
    firstName: 'Sarah',
    age: 26,
    location: 'San Francisco, CA',
    jobTitle: 'Product Designer',
    company: 'Figma',
    school: 'RISD',
    height: 165,
    hometown: 'Portland, OR',
    religion: 'SPIRITUAL',
    politics: 'LIBERAL',
    drinking: 'SOMETIMES',
    smoking: 'NO',
    photos: [
      { id: 'p1', url: generatePlaceholderPhoto(101), position: 1 },
      { id: 'p2', url: generatePlaceholderPhoto(102), position: 2 },
      { id: 'p3', url: generatePlaceholderPhoto(103), position: 3 },
      { id: 'p4', url: generatePlaceholderPhoto(104), position: 4 },
      { id: 'p5', url: generatePlaceholderPhoto(105), position: 5 },
      { id: 'p6', url: generatePlaceholderPhoto(106), position: 6 },
    ],
    prompts: [
      { id: 'pr1', promptTemplateId: '1', promptText: 'A shower thought I recently had', answer: 'If you clean a vacuum cleaner, you become the vacuum cleaner.', position: 1 },
      { id: 'pr2', promptTemplateId: '6', promptText: 'Dating me is like', answer: 'Finding a parking spot in SF - rare, exciting, and totally worth the wait.', position: 2 },
      { id: 'pr3', promptTemplateId: '9', promptText: 'Typical Sunday', answer: 'Farmers market run, pour-over coffee, design side projects, sunset hike at Lands End.', position: 3 },
    ],
    isMostCompatible: true,
    compatibilityScore: 95,
  },
  {
    id: '2',
    firstName: 'Emma',
    age: 28,
    location: 'Brooklyn, NY',
    jobTitle: 'Software Engineer',
    company: 'Stripe',
    school: 'MIT',
    height: 170,
    hometown: 'Boston, MA',
    religion: 'AGNOSTIC',
    politics: 'MODERATE',
    drinking: 'YES',
    smoking: 'NO',
    photos: [
      { id: 'p7', url: generatePlaceholderPhoto(201), position: 1 },
      { id: 'p8', url: generatePlaceholderPhoto(202), position: 2 },
      { id: 'p9', url: generatePlaceholderPhoto(203), position: 3 },
      { id: 'p10', url: generatePlaceholderPhoto(204), position: 4 },
      { id: 'p11', url: generatePlaceholderPhoto(205), position: 5 },
      { id: 'p12', url: generatePlaceholderPhoto(206), position: 6 },
    ],
    prompts: [
      { id: 'pr4', promptTemplateId: '3', promptText: 'I geek out on', answer: 'Mechanical keyboards, distributed systems, and making the perfect sourdough.', position: 1 },
      { id: 'pr5', promptTemplateId: '5', promptText: 'The hallmark of a good relationship is', answer: 'Being able to sit in comfortable silence, then breaking it with a terrible pun.', position: 2 },
      { id: 'pr6', promptTemplateId: '13', promptText: "I won't shut up about", answer: 'The latest Rust features. I am sorry in advance.', position: 3 },
    ],
    isMostCompatible: false,
  },
  {
    id: '3',
    firstName: 'Olivia',
    age: 25,
    location: 'Austin, TX',
    jobTitle: 'Data Scientist',
    company: 'Tesla',
    school: 'UT Austin',
    height: 163,
    hometown: 'Dallas, TX',
    religion: 'CHRISTIAN',
    politics: 'MODERATE',
    drinking: 'SOMETIMES',
    smoking: 'NO',
    photos: [
      { id: 'p13', url: generatePlaceholderPhoto(301), position: 1 },
      { id: 'p14', url: generatePlaceholderPhoto(302), position: 2 },
      { id: 'p15', url: generatePlaceholderPhoto(303), position: 3 },
      { id: 'p16', url: generatePlaceholderPhoto(304), position: 4 },
      { id: 'p17', url: generatePlaceholderPhoto(305), position: 5 },
      { id: 'p18', url: generatePlaceholderPhoto(306), position: 6 },
    ],
    prompts: [
      { id: 'pr7', promptTemplateId: '2', promptText: 'My simple pleasures', answer: 'Morning runs along Lady Bird Lake, tacos al pastor, and thunderstorm watching from the porch.', position: 1 },
      { id: 'pr8', promptTemplateId: '10', promptText: 'A life goal of mine', answer: 'Visit all 63 national parks. Currently at 18 and counting.', position: 2 },
      { id: 'pr9', promptTemplateId: '20', promptText: 'The key to my heart is', answer: 'Good banter, spontaneous road trips, and knowing when to just bring me queso.', position: 3 },
    ],
    isMostCompatible: false,
  },
  {
    id: '4',
    firstName: 'Maya',
    age: 27,
    location: 'Seattle, WA',
    jobTitle: 'UX Researcher',
    company: 'Amazon',
    school: 'University of Washington',
    height: 168,
    hometown: 'Vancouver, BC',
    photos: [
      { id: 'p19', url: generatePlaceholderPhoto(401), position: 1 },
      { id: 'p20', url: generatePlaceholderPhoto(402), position: 2 },
      { id: 'p21', url: generatePlaceholderPhoto(403), position: 3 },
      { id: 'p22', url: generatePlaceholderPhoto(404), position: 4 },
      { id: 'p23', url: generatePlaceholderPhoto(405), position: 5 },
      { id: 'p24', url: generatePlaceholderPhoto(406), position: 6 },
    ],
    prompts: [
      { id: 'pr10', promptTemplateId: '7', promptText: 'My most irrational fear', answer: 'That my Spotify wrapped will reveal I listened to the same song 2,000 times.', position: 1 },
      { id: 'pr11', promptTemplateId: '12', promptText: 'Together, we could', answer: 'Start a book club for two, try every ramen spot in the city, and adopt a senior dog.', position: 2 },
      { id: 'pr12', promptTemplateId: '15', promptText: 'The way to win me over is', answer: 'Remember the little things I mention in passing. That is the ultimate flex.', position: 3 },
    ],
    isMostCompatible: false,
  },
  {
    id: '5',
    firstName: 'Ava',
    age: 24,
    location: 'Chicago, IL',
    jobTitle: 'Graphic Designer',
    company: 'Freelance',
    school: 'School of the Art Institute',
    height: 160,
    hometown: 'Minneapolis, MN',
    photos: [
      { id: 'p25', url: generatePlaceholderPhoto(501), position: 1 },
      { id: 'p26', url: generatePlaceholderPhoto(502), position: 2 },
      { id: 'p27', url: generatePlaceholderPhoto(503), position: 3 },
      { id: 'p28', url: generatePlaceholderPhoto(504), position: 4 },
      { id: 'p29', url: generatePlaceholderPhoto(505), position: 5 },
      { id: 'p30', url: generatePlaceholderPhoto(506), position: 6 },
    ],
    prompts: [
      { id: 'pr13', promptTemplateId: '17', promptText: 'Believe it or not, I', answer: 'Once accidentally submitted fan art instead of my portfolio to a job application. Got the job anyway.', position: 1 },
      { id: 'pr14', promptTemplateId: '8', promptText: 'Two truths and a lie', answer: "I've swum with sharks, I can juggle, and I've met Barack Obama. (The juggling is a lie.)", position: 2 },
      { id: 'pr15', promptTemplateId: '4', promptText: "I'm looking for", answer: 'Someone who can match my energy at a concert but also enjoy a quiet night sketching together.', position: 3 },
    ],
    isMostCompatible: false,
  },
];

export default function DiscoverPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { profiles, currentIndex, isLoading, hasMore, setProfiles, addProfiles, nextProfile, setLoading, setHasMore } = useDiscoverStore();
  const [isAnimatingOut, setIsAnimatingOut] = useState<'like' | 'skip' | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/discover/feed', {
        params: { page: 1, limit: 10 },
      });
      const apiData = response.data.data || response.data;
      const cards = apiData.cards || apiData;
      const fetchedProfiles = Array.isArray(cards)
        ? cards.map((card: Record<string, unknown>) => {
            const u = (card.user || card) as Record<string, unknown>;
            return {
              id: u.id,
              firstName: u.firstName,
              age: u.age,
              location: u.hometown,
              jobTitle: u.jobTitle,
              company: u.company,
              school: u.school,
              height: u.height,
              hometown: u.hometown,
              religion: u.religion,
              politics: u.politics,
              drinking: u.drinking,
              smoking: u.smoking,
              photos: u.photos,
              prompts: u.prompts,
              isMostCompatible: card.isMostCompatible,
              compatibilityScore: card.compatibilityScore,
            };
          })
        : [];
      if (fetchedProfiles.length > 0) {
        setProfiles(fetchedProfiles);
        setHasMore(apiData.hasMore ?? fetchedProfiles.length >= 10);
      } else {
        // Use demo profiles if API returns empty
        setProfiles(DEMO_PROFILES);
        setHasMore(false);
      }
    } catch {
      // API not available, use demo data
      setProfiles(DEMO_PROFILES);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [setProfiles, setLoading, setHasMore]);

  useEffect(() => {
    if (profiles.length === 0) {
      fetchProfiles();
    }
  }, [fetchProfiles, profiles.length]);

  const currentProfile = profiles[currentIndex];
  const isOutOfProfiles = !currentProfile && !isLoading;

  const handleLike = async (
    targetType: 'PHOTO' | 'PROMPT',
    targetId: string,
    comment?: string
  ) => {
    if (!currentProfile) return;

    setIsAnimatingOut('like');

    try {
      const response = await api.post('/likes', {
        toUserId: currentProfile.id,
        targetType,
        targetId,
        comment,
      });

      // Check if this resulted in a match
      if (response.data?.data?.isMatch) {
        setMatchedUser({
          name: currentProfile.firstName,
          photo: currentProfile.photos[0]?.url,
        });
        setShowMatch(true);
      } else {
        toast.success(`Liked ${currentProfile.firstName}!`, {
          icon: '❤️',
          duration: 1500,
        });
      }
    } catch {
      // Even on error, progress to next profile in demo mode
      toast.success(`Liked ${currentProfile.firstName}!`, {
        icon: '❤️',
        duration: 1500,
      });

      // Simulate occasional match (20% chance)
      if (Math.random() < 0.2) {
        setMatchedUser({
          name: currentProfile.firstName,
          photo: currentProfile.photos[0]?.url,
        });
        setTimeout(() => setShowMatch(true), 400);
      }
    }

    setTimeout(() => {
      nextProfile();
      setIsAnimatingOut(null);
    }, 400);
  };

  const handleSkip = () => {
    if (!currentProfile) return;

    setIsAnimatingOut('skip');

    // Optionally notify the API
    api.post('/likes/skip', { toUserId: currentProfile.id }).catch(() => {
      // Ignore errors for skip
    });

    setTimeout(() => {
      nextProfile();
      setIsAnimatingOut(null);
    }, 400);
  };

  const handleRefresh = () => {
    fetchProfiles();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-hinge-primary" fill="currentColor" />
            <h1 className="text-lg font-bold gradient-text">Discover</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-hinge-surface-light transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-hinge-text-secondary" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Loading state */}
        {isLoading && profiles.length === 0 && (
          <div className="space-y-4">
            {/* Skeleton card */}
            <div className="rounded-2xl overflow-hidden bg-hinge-surface">
              <div className="aspect-[3/4] shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-40 shimmer rounded" />
                <div className="h-4 w-60 shimmer rounded" />
                <div className="h-24 shimmer rounded-xl" />
                <div className="h-24 shimmer rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Profile card */}
        {currentProfile && !isLoading && (
          <AnimatePresence mode="wait">
            <ProfileCard
              key={currentProfile.id}
              profile={currentProfile}
              onLike={handleLike}
              onSkip={handleSkip}
              isAnimatingOut={isAnimatingOut}
            />
          </AnimatePresence>
        )}

        {/* Out of profiles */}
        {isOutOfProfiles && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-20 h-20 rounded-full bg-hinge-surface flex items-center justify-center mb-6">
              <Frown className="w-10 h-10 text-hinge-text-muted" />
            </div>
            <h2 className="text-xl font-bold mb-2">No more profiles</h2>
            <p className="text-hinge-text-secondary mb-8 max-w-xs">
              You&apos;ve seen everyone nearby. Try expanding your preferences or check back later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/likes')}
                className="btn-secondary flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                View Likes
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading more indicator */}
        {isLoading && profiles.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-hinge-primary animate-spin" />
          </div>
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
