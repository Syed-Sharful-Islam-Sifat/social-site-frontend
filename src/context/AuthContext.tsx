'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { API } from '@/lib/endpoints';

const PRESENCE_COOKIE = 'auth_presence';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function setPresenceCookie() {
  document.cookie = `${PRESENCE_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; secure; samesite=lax`;
}

function clearPresenceCookie() {
  document.cookie = `${PRESENCE_COOKIE}=; path=/; max-age=0`;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string, repeatPassword: string, agreed: boolean) => Promise<{ ok: boolean; error?: string; field?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api<unknown>(API.auth.me)
      .then((data) => {
        const user = (data as { user: User }).user ?? (data as User);
        setUser(user ?? null);
        setPresenceCookie();
      })
      .catch(async (err: ApiError) => {
        if (err.status === 401) {
          await api(API.auth.logout, { method: 'POST' }).catch(() => {});
          clearPresenceCookie();
        }
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: found } = await api<{ user: User }>(API.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(found);
      setPresenceCookie();
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    repeatPassword: string,
    agreed: boolean,
  ): Promise<{ ok: boolean; error?: string; field?: string }> => {
    try {
      const { user: newUser } = await api<{ user: User }>(API.auth.register, {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password, repeatPassword, agreed }),
      });
      setUser(newUser);
      setPresenceCookie();
      return { ok: true };
    } catch (err) {
      const { message, field } = err as ApiError;
      return { ok: false, error: message, field };
    }
  };

  const logout = async () => {
    await api(API.auth.logout, { method: 'POST' }).catch(() => {});
    clearPresenceCookie();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
