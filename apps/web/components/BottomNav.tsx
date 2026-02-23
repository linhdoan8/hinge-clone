'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Heart, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLikesStore, useMatchesStore } from '@/lib/store';

interface NavItem {
  href: string;
  icon: typeof Compass;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/likes', icon: Heart, label: 'Likes' },
  { href: '/matches', icon: MessageCircle, label: 'Matches' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const likesCount = useLikesStore((s) => s.likes.length);
  const unreadMessages = useMatchesStore((s) =>
    s.matches.reduce((sum, m) => sum + m.unreadCount, 0)
  );

  const getBadgeCount = (href: string): number => {
    switch (href) {
      case '/likes':
        return likesCount;
      case '/matches':
        return unreadMessages;
      default:
        return 0;
    }
  };

  return (
    <nav className="bottom-nav safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const badge = getBadgeCount(item.href);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-hinge-primary'
                  : 'text-hinge-text-muted hover:text-hinge-text-secondary'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn('w-6 h-6 transition-all', isActive && 'scale-110')}
                  fill={isActive && item.icon === Heart ? 'currentColor' : 'none'}
                />
                {badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-hinge-secondary flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  </motion.div>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'text-hinge-primary')}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0.5 w-5 h-0.5 rounded-full bg-hinge-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
