'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastContainer from '@/components/Toast/ToastContainer';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;
const DURATION = 3500;
const EXIT_DURATION = 320;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), EXIT_DURATION);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => dismiss(id), DURATION);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
