'use client';

import { ToastItem } from '@/context/ToastContext';
import styles from './Toast.module.css';

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const ICONS: Record<ToastItem['type'], string> = {
  error: '✕',
  success: '✓',
  info: 'i',
};

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (!toasts.length) return null;

  return (
    <div className={styles['toast-stack']} aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles['toast']} ${styles[toast.type]} ${toast.exiting ? styles['exiting'] : ''}`}
          role="alert"
        >
          <span className={styles['toast-icon']}>{ICONS[toast.type]}</span>
          <p className={styles['toast-message']}>{toast.message}</p>
          <button
            type="button"
            className={styles['toast-close']}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
