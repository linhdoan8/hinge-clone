'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Sparkles, MessageCircle, Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      router.replace('/discover');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hinge-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-hinge-primary"
        >
          <Heart className="w-12 h-12 animate-pulse" fill="currentColor" />
        </motion.div>
      </div>
    );
  }

  if (isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-hinge-dark overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-hinge-primary/10 via-transparent to-hinge-dark" />

        {/* Floating hearts background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-hinge-primary/10"
              initial={{
                x: `${15 + i * 15}%`,
                y: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [`${20 + (i % 3) * 25}%`, `${15 + (i % 3) * 25}%`, `${20 + (i % 3) * 25}%`],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Heart className="w-8 h-8 md:w-12 md:h-12" fill="currentColor" />
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center justify-between px-6 py-5"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-hinge-primary" fill="currentColor" />
            <span className="text-xl font-bold gradient-text">Hinge</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-medium text-hinge-text-secondary hover:text-white transition-colors px-4 py-2 rounded-full border border-hinge-border hover:border-hinge-primary"
          >
            Log in
          </button>
        </motion.header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-lg mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hinge-primary/10 border border-hinge-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-hinge-accent" />
              <span className="text-sm text-hinge-accent font-medium">
                The dating app
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">Designed</span>
              <br />
              <span className="text-white">to be </span>
              <span className="gradient-text">Deleted</span>
            </h1>

            <p className="text-lg md:text-xl text-hinge-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
              Hinge is built on the belief that meaningful connections lead to better
              relationships. Not endless swiping.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/signup')}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-hinge text-white font-semibold text-lg shadow-button hover:shadow-glow transition-all duration-300"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <p className="mt-5 text-sm text-hinge-text-muted">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-hinge-primary hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            Why <span className="gradient-text">Hinge</span> is different
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Like What You Love',
                description:
                  'Like specific photos or prompts to start meaningful conversations, not generic swipes.',
                color: 'text-hinge-secondary',
                bgColor: 'bg-hinge-secondary/10',
              },
              {
                icon: MessageCircle,
                title: 'Real Conversations',
                description:
                  'Every like comes with the option to leave a comment. Better openers, better matches.',
                color: 'text-hinge-primary',
                bgColor: 'bg-hinge-primary/10',
              },
              {
                icon: Shield,
                title: 'Safe & Secure',
                description:
                  'Photo verification, robust reporting, and a community that values respect.',
                color: 'text-hinge-accent',
                bgColor: 'bg-hinge-accent/10',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="p-8 rounded-2xl bg-hinge-surface border border-hinge-border hover:border-hinge-primary/30 transition-all duration-300 group"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-hinge-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-hinge-primary/20 to-hinge-secondary/10 border border-hinge-primary/20"
        >
          <Heart
            className="w-10 h-10 text-hinge-primary mx-auto mb-6"
            fill="currentColor"
          />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to find your person?
          </h2>
          <p className="text-hinge-text-secondary text-lg mb-8">
            Join millions who have found meaningful connections on Hinge.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/signup')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-hinge text-white font-semibold text-lg shadow-button hover:shadow-glow transition-all duration-300"
          >
            Create Your Profile
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-hinge-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-hinge-primary" fill="currentColor" />
            <span className="font-semibold gradient-text">Hinge Clone</span>
          </div>
          <p className="text-sm text-hinge-text-muted">
            A demo project. Not affiliated with Hinge or Match Group.
          </p>
        </div>
      </footer>
    </div>
  );
}
