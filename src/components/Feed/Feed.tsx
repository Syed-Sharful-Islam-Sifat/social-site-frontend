'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { API } from '@/lib/endpoints';
import { Post, LikeInfo } from '@/lib/types';
import Navbar from '@/components/Navbar/Navbar';
import LeftSidebar from '@/components/LeftSidebar/LeftSidebar';
import RightSidebar from '@/components/RightSidebar/RightSidebar';
import Stories from '@/components/Stories/Stories';
import CreatePost from '@/components/CreatePost/CreatePost';
import PostCard from '@/components/PostCard/PostCard';
import styles from './Feed.module.css';

const DEFAULT_AVATAR = '/default-avatar.svg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePost(p: any): Post {
  return {
    ...p,
    id: p.id ?? p._id,
    authorAvatar: p.authorAvatar || DEFAULT_AVATAR,
    likes: p.likes ?? [],
    comments: (p.comments ?? []).map((c: any) => ({
      ...c,
      id: c.id ?? c._id,
      authorAvatar: c.authorAvatar || DEFAULT_AVATAR,
      likes: c.likes ?? [],
      replies: (c.replies ?? []).map((r: any) => ({
        ...r,
        id: r.id ?? r._id,
        authorAvatar: r.authorAvatar || DEFAULT_AVATAR,
        likes: r.likes ?? [],
      })),
    })),
  };
}

export default function Feed() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    api<unknown>(API.posts.feed)
      .then((data) => {
        const raw = Array.isArray(data)
          ? (data as unknown[])
          : ((data as { posts: unknown[] }).posts ?? []);
        setPosts(raw.map(normalizePost));
      })
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  }, [darkMode]);

  const handleNewPost = (post: Post) => setPosts(prev => [normalizePost(post), ...prev]);

  const handleLikePost = (postId: string) => {
    if (!user) return;
    const liker: LikeInfo = { userId: user.id, userName: `${user.firstName} ${user.lastName}` };
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      const already = p.likes.some(l => l.userId === user.id);
      return { ...p, likes: already ? p.likes.filter(l => l.userId !== user.id) : [...p.likes, liker] };
    }));
  };

  const handleAddComment = (postId: string, content: string) => {
    if (!user) return;
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      const comment = {
        id: `comment-${Date.now()}`,
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
        authorAvatar: user.avatar,
        content,
        likes: [],
        createdAt: new Date().toISOString(),
        replies: [],
      };
      return { ...p, comments: [...p.comments, comment] };
    }));
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    if (!user) return;
    const liker: LikeInfo = { userId: user.id, userName: `${user.firstName} ${user.lastName}` };
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => {
          if (c.id !== commentId) return c;
          const already = c.likes.some(l => l.userId === user.id);
          return { ...c, likes: already ? c.likes.filter(l => l.userId !== user.id) : [...c.likes, liker] };
        }),
      };
    }));
  };

  const handleAddReply = (postId: string, commentId: string, content: string) => {
    if (!user) return;
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => {
          if (c.id !== commentId) return c;
          const reply = {
            id: `reply-${Date.now()}`,
            authorId: user.id,
            authorName: `${user.firstName} ${user.lastName}`,
            authorAvatar: user.avatar,
            content,
            likes: [],
            createdAt: new Date().toISOString(),
          };
          return { ...c, replies: [...c.replies, reply] };
        }),
      };
    }));
  };

  const handleLikeReply = (postId: string, commentId: string, replyId: string) => {
    if (!user) return;
    const liker: LikeInfo = { userId: user.id, userName: `${user.firstName} ${user.lastName}` };
    setPosts(posts.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            replies: c.replies.map(r => {
              if (r.id !== replyId) return r;
              const already = r.likes.some(l => l.userId === user.id);
              return { ...r, likes: already ? r.likes.filter(l => l.userId !== user.id) : [...r.likes, liker] };
            }),
          };
        }),
      };
    }));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleEditPost = (postId: string, newContent: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, content: newContent } : p));
  };

  const handleToggleVisibility = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, isPublic: !p.isPublic } : p));
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;
  return (
    <div className={styles['feed-root']}>
      <Navbar />

      <main className={styles['feed-main']}>
        <div className={styles['feed-layout']}>
          <div className={styles['col-left']}>
            <LeftSidebar />
          </div>

          <div className={styles['col-center']}>
            <Stories />
            <CreatePost user={user} onPost={handleNewPost} />
            <div className={styles['posts-list']}>
              {postsLoading ? null : posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLikePost={handleLikePost}
                  onAddComment={handleAddComment}
                  onLikeComment={handleLikeComment}
                  onAddReply={handleAddReply}
                  onLikeReply={handleLikeReply}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </div>

          <div className={styles['col-right']}>
            <RightSidebar />
          </div>
        </div>
      </main>

      <button
        type="button"
        className={styles['dark-toggle']}
        onClick={() => setDarkMode(m => !m)}
        aria-label="Toggle dark mode"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
          </svg>
        )}
      </button>
    </div>
  );
}
