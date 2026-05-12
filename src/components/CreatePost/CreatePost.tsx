'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { User, Post } from '@/lib/types';
import { api } from '@/lib/api';
import { API } from '@/lib/endpoints';
import styles from './CreatePost.module.css';

interface CreatePostProps {
  user: User;
  onPost: (post: Post) => void;
}

export default function CreatePost({ user, onPost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const file = fileRef.current?.files?.[0];
      let data: unknown;

      if (file) {
        const formData = new FormData();
        formData.append('content', content.trim());
        formData.append('isPublic', String(isPublic));
        formData.append('image', file);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API.posts.feed}`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const body = await res.json();
        if (!body.success) throw body;
        data = body.data;
      } else {
        data = await api<unknown>(API.posts.feed, {
          method: 'POST',
          body: JSON.stringify({ content: content.trim(), isPublic }),
        });
      }

      const post: Post = (data as { post: Post }).post ?? (data as Post);
      onPost(post);
      setContent('');
      setImage(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setError('Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles['create-post']}>
      <div className={styles['top-row']}>
        <Image
          src={user.avatar || '/default-avatar.svg'}
          alt={user.firstName}
          width={44}
          height={44}
          className={styles['user-avatar']}
        />
        <textarea
          className={styles['textarea']}
          placeholder="Write something..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={2}
        />
      </div>

      {image && (
        <div className={styles['image-preview-wrap']}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Preview" className={styles['image-preview']} />
          <button
            type="button"
            className={styles['remove-image']}
            onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ''; }}
            aria-label="Remove image"
          >
            &times;
          </button>
        </div>
      )}

      {error && <p className={styles['post-error']}>{error}</p>}

      <div className={styles['bottom-row']}>
        <div className={styles['media-btns']}>
          <button
            type="button"
            className={styles['media-btn']}
            onClick={() => fileRef.current?.click()}
            title="Add photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            Photo
          </button>
          <button type="button" className={styles['media-btn']} title="Add video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
            Video
          </button>
          <button type="button" className={styles['media-btn']} title="Add event">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
            </svg>
            Event
          </button>
          <button type="button" className={styles['media-btn']} title="Write article">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            Article
          </button>
        </div>

        <div className={styles['post-actions']}>
          <select
            className={styles['visibility-select']}
            value={isPublic ? 'public' : 'friends'}
            onChange={e => setIsPublic(e.target.value === 'public')}
          >
            <option value="public">🌐 Public</option>
            <option value="friends">👥 Friends</option>
          </select>
          <button
            type="button"
            className={styles['post-btn']}
            onClick={handlePost}
            disabled={submitting || !content.trim()}
          >
            Post
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles['file-input']}
        onChange={handleImageChange}
      />
    </div>
  );
}
