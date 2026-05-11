'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { getCurrentUser, setCurrentUserId, getUsers, saveUsers } from '@/lib/storage';
import { assets } from '@/assets';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return false;
    setCurrentUserId(found.id);
    setUser(found);
    return true;
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      firstName,
      lastName,
      email,
      password,
      avatar: assets.profileFallback,
    };
    saveUsers([...users, newUser]);
    setCurrentUserId(newUser.id);
    setUser(newUser);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUserId(null);
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
