'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { API } from '@/lib/endpoints';

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
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: found } = await api<{ user: User }>(API.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(found);
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
      return { ok: true };
    } catch (err) {
      const { message, field } = err as ApiError;
      return { ok: false, error: message, field };
    }
  };

  const logout = async () => {
    await api(API.auth.logout, { method: 'POST' }).catch(() => {});
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
