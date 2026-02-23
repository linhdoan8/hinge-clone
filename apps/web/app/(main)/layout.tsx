'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, setUser, setAuthenticated, setLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Initialize socket connection when authenticated
  useSocket();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      router.replace('/login');
      setIsChecking(false);
      return;
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setAuthenticated(true);

        if (!parsed.profileComplete) {
          router.replace('/onboarding');
          setIsChecking(false);
          return;
        }
      } catch {
        router.replace('/login');
        setIsChecking(false);
        return;
      }
    }

    setLoading(false);
    setIsChecking(false);
  }, [router, setUser, setAuthenticated, setLoading]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-hinge-dark">
        <Heart className="w-10 h-10 text-hinge-primary animate-pulse mb-4" fill="currentColor" />
        <Loader2 className="w-6 h-6 text-hinge-text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hinge-dark pb-20">
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
