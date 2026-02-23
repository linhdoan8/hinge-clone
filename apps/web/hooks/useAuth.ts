'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore, type User } from '@/lib/store';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setAuthenticated,
    setLoading,
    login: storeLogin,
    logout: storeLogout,
    updateProfile,
  } = useAuthStore();

  const initialize = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setAuthenticated(true);
        } catch {
          // Stored user data corrupted, fetch from API
        }
      }

      try {
        const response = await api.get('/users/me');
        const freshUser = response.data;
        setUser(freshUser);
        setAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (error) {
        // Token might be invalid, clear auth
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [setUser, setAuthenticated, setLoading]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      storeLogin(userData, accessToken, refreshToken);
      return userData;
    },
    [storeLogin]
  );

  const signup = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const response = await api.post('/auth/signup', data);
      const { user: userData, accessToken, refreshToken } = response.data;
      storeLogin(userData, accessToken, refreshToken);
      return userData;
    },
    [storeLogin]
  );

  const logout = useCallback(() => {
    storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      const freshUser = response.data;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      return null;
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    refreshProfile,
  };
}
