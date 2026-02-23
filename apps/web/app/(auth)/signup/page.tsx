'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and a number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      const { user, accessToken, refreshToken } = response.data;
      login(user, accessToken, refreshToken);
      toast.success('Account created! Let\'s set up your profile.');
      router.push('/onboarding');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-hinge-dark">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-hinge-primary/5 via-transparent to-hinge-secondary/5" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hinge mb-4"
            >
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-hinge-text-secondary">
              Start your journey to meaningful connections
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-hinge-text-secondary mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hinge-text-muted" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="First"
                    className={`input-field pl-10 text-sm ${
                      errors.firstName ? 'ring-2 ring-hinge-danger border-hinge-danger' : ''
                    }`}
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-hinge-danger">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-hinge-text-secondary mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Last"
                  className={`input-field text-sm ${
                    errors.lastName ? 'ring-2 ring-hinge-danger border-hinge-danger' : ''
                  }`}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-hinge-danger">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-hinge-text-secondary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hinge-text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`input-field pl-11 ${
                    errors.email ? 'ring-2 ring-hinge-danger border-hinge-danger' : ''
                  }`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-hinge-danger">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-hinge-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hinge-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={`input-field pl-11 pr-12 ${
                    errors.password ? 'ring-2 ring-hinge-danger border-hinge-danger' : ''
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-hinge-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-hinge-danger">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-hinge-text-secondary mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hinge-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={`input-field pl-11 ${
                    errors.confirmPassword ? 'ring-2 ring-hinge-danger border-hinge-danger' : ''
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-hinge-danger">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-hinge-text-muted leading-relaxed">
            By creating an account, you agree to our{' '}
            <span className="text-hinge-primary">Terms of Service</span> and{' '}
            <span className="text-hinge-primary">Privacy Policy</span>.
          </p>

          {/* Login link */}
          <p className="text-center mt-6 text-hinge-text-secondary">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-hinge-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
