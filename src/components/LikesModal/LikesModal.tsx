'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import styles from './LikesModal.module.css';

interface LikeEntry {
  name: string;
  avatar: string;
}

function normalizeLike(item: any): LikeEntry { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (item.user) {
    return {
      name: `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() || 'User',
      avatar: item.user.avatar || '/default-avatar.svg',
    };
  }
  if (item.firstName || item.lastName) {
    return {
      name: `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || 'User',
      avatar: item.avatar || '/default-avatar.svg',
    };
  }
  return {
    name: item.userName ?? item.name ?? 'User',
    avatar: item.avatar || '/default-avatar.svg',
  };
}

interface Props {
  endpoint: string | null;
  onClose: () => void;
}

export default function LikesModal({ endpoint, onClose }: Props) {
  const [likes, setLikes] = useState<LikeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!endpoint) { setLikes([]); return; }
    setLoading(true);
    api<unknown>(endpoint)
      .then(data => {
        const raw = Array.isArray(data)
          ? (data as unknown[])
          : ((data as { likes: unknown[] }).likes ?? []);
        setLikes((raw as unknown[]).map(normalizeLike));
      })
      .catch(() => setLikes([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    if (!endpoint) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [endpoint, onClose]);

  if (!endpoint) return null;

  return (
    <div
      className={styles['backdrop']}
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className={styles['modal']} role="dialog" aria-modal="true" aria-label="Liked by">
        <div className={styles['modal-header']}>
          <h3 className={styles['modal-title']}>Liked by</h3>
          <button type="button" className={styles['modal-close']} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles['modal-body']}>
          {loading ? (
            <p className={styles['state-text']}>Loading…</p>
          ) : likes.length === 0 ? (
            <p className={styles['state-text']}>No likes yet.</p>
          ) : (
            <ul className={styles['likes-list']}>
              {likes.map((like, i) => (
                <li key={i} className={styles['like-item']}>
                  <Image
                    src={like.avatar}
                    alt={like.name}
                    width={38}
                    height={38}
                    className={styles['like-avatar']}
                  />
                  <span className={styles['like-name']}>{like.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
