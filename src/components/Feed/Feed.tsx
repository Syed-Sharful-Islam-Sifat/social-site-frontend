'use client';

import { useState, useEffect } from 'react';
import { produce } from 'immer';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { API } from '@/lib/endpoints';
import { Post, Comment, Reply } from '@/lib/types';
import Navbar from '@/components/Navbar/Navbar';
import LeftSidebar from '@/components/LeftSidebar/LeftSidebar';
import RightSidebar from '@/components/RightSidebar/RightSidebar';
import Stories from '@/components/Stories/Stories';
import CreatePost from '@/components/CreatePost/CreatePost';
import PostCard from '@/components/PostCard/PostCard';
import styles from './Feed.module.css';

const DEFAULT_AVATAR = '/default-avatar.svg';

function normalizeReply(r: any): Reply { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    ...r,
    id: r.id ?? r._id,
    authorId: r.author?._id ?? r.authorId,
    authorName: r.author ? `${r.author.firstName} ${r.author.lastName}` : (r.authorName ?? ''),
    authorAvatar: r.author?.avatar || r.authorAvatar || DEFAULT_AVATAR,
    likeCount: r.likeCount ?? 0,
    likedByMe: r.likedByMe ?? false,
  };
}

function normalizeComment(c: any): Comment { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    ...c,
    id: c.id ?? c._id,
    authorId: c.author?._id ?? c.authorId,
    authorName: c.author ? `${c.author.firstName} ${c.author.lastName}` : (c.authorName ?? ''),
    authorAvatar: c.author?.avatar || c.authorAvatar || DEFAULT_AVATAR,
    likeCount: c.likeCount ?? 0,
    likedByMe: c.likedByMe ?? false,
    replyCount: c.replyCount ?? 0,
    replies: (c.replies ?? []).map(normalizeReply),
    repliesLoaded: Array.isArray(c.replies) && c.replies.length > 0,
  };
}

function normalizePost(p: any): Post { // eslint-disable-line @typescript-eslint/no-explicit-any
  const commentCount = p.commentCount ?? 0;
  return {
    ...p,
    id: p.id ?? p._id,
    authorId: p.author?._id ?? p.authorId,
    authorName: p.author ? `${p.author.firstName} ${p.author.lastName}` : (p.authorName ?? ''),
    authorAvatar: p.author?.avatar || p.authorAvatar || DEFAULT_AVATAR,
    visibility: p.visibility ?? 'public',
    likeCount: p.likeCount ?? 0,
    likedByMe: p.likedByMe ?? false,
    commentCount,
    comments: [],
    commentsLoaded: commentCount === 0,
  };
}

export default function Feed() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  const handleNewPost = (post: Post) => setPosts(prev => [normalizePost(post), ...prev]);

  const handleLoadComments = async (postId: string) => {
    const alreadyLoaded = posts.find(p => p.id === postId)?.commentsLoaded;
    if (alreadyLoaded) return;
    try {
      const data = await api<unknown>(API.posts.comments(postId));
      const raw = Array.isArray(data)
        ? (data as unknown[])
        : ((data as { comments: unknown[] }).comments ?? []);
      setPosts(prev => produce(prev, draft => {
        const post = draft.find(p => p.id === postId);
        if (!post) return;
        post.comments = raw.map(normalizeComment);
        post.commentsLoaded = true;
      }));
    } catch {
      showToast('Failed to load comments.', 'error');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const applyToggle = (prev: Post[]) => produce(prev, draft => {
      const post = draft.find(p => p.id === postId);
      if (!post) return;
      post.likedByMe = !post.likedByMe;
      post.likeCount += post.likedByMe ? 1 : -1;
    });
    setPosts(applyToggle);
    try {
      await api(API.posts.like(postId), { method: 'POST' });
    } catch {
      setPosts(applyToggle);
      showToast('Failed to like post.', 'error');
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) return;
    try {
      const data = await api<unknown>(API.posts.comments(postId), {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const raw = (data as { comment: unknown }).comment ?? data;
      const comment = normalizeComment(raw);
      setPosts(prev => produce(prev, draft => {
        const post = draft.find(p => p.id === postId);
        if (!post) return;
        post.comments.push(comment);
        post.commentCount += 1;
        post.commentsLoaded = true;
      }));
    } catch {
      showToast('Failed to post comment.', 'error');
    }
  };

  const handleLoadReplies = async (postId: string, commentId: string) => {
    const comment = posts.find(p => p.id === postId)?.comments.find(c => c.id === commentId);
    if (!comment || comment.repliesLoaded) return;
    try {
      const data = await api<unknown>(API.comments.replies(commentId));
      const raw = Array.isArray(data)
        ? (data as unknown[])
        : ((data as { replies: unknown[] }).replies ?? []);
      setPosts(prev => produce(prev, draft => {
        const c = draft.find(p => p.id === postId)?.comments.find(c => c.id === commentId);
        if (!c) return;
        c.replies = raw.map(normalizeReply);
        c.repliesLoaded = true;
      }));
    } catch {
      showToast('Failed to load replies.', 'error');
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user) return;
    const applyToggle = (prev: Post[]) => produce(prev, draft => {
      const comment = draft.find(p => p.id === postId)?.comments.find(c => c.id === commentId);
      if (!comment) return;
      comment.likedByMe = !comment.likedByMe;
      comment.likeCount += comment.likedByMe ? 1 : -1;
    });
    setPosts(applyToggle);
    try {
      await api(API.comments.like(commentId), { method: 'POST' });
    } catch {
      setPosts(applyToggle);
      showToast('Failed to like comment.', 'error');
    }
  };

  const handleAddReply = async (postId: string, commentId: string, content: string) => {
    if (!user) return;
    try {
      const data = await api<unknown>(API.comments.replies(commentId), {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const raw = (data as { reply: unknown }).reply ?? data;
      const reply = normalizeReply(raw);
      setPosts(prev => produce(prev, draft => {
        const comment = draft.find(p => p.id === postId)?.comments.find(c => c.id === commentId);
        if (!comment) return;
        comment.replies.push(reply);
        comment.replyCount += 1;
      }));
    } catch {
      showToast('Failed to post reply.', 'error');
    }
  };

  const handleLikeReply = async (postId: string, commentId: string, replyId: string) => {
    if (!user) return;
    const applyToggle = (prev: Post[]) => produce(prev, draft => {
      const reply = draft
        .find(p => p.id === postId)
        ?.comments.find(c => c.id === commentId)
        ?.replies.find(r => r.id === replyId);
      if (!reply) return;
      reply.likedByMe = !reply.likedByMe;
      reply.likeCount += reply.likedByMe ? 1 : -1;
    });
    setPosts(applyToggle);
    try {
      await api(API.replies.like(replyId), { method: 'POST' });
    } catch {
      setPosts(applyToggle);
      showToast('Failed to like reply.', 'error');
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleEditPost = (postId: string, newContent: string) => {
    setPosts(prev => produce(prev, draft => {
      const post = draft.find(p => p.id === postId);
      if (post) post.content = newContent;
    }));
  };

  const handleToggleVisibility = (postId: string) => {
    setPosts(prev => produce(prev, draft => {
      const post = draft.find(p => p.id === postId);
      if (post) post.visibility = post.visibility === 'public' ? 'private' : 'public';
    }));
  };

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
                  onLoadComments={handleLoadComments}
                  onAddComment={handleAddComment}
                  onLikeComment={handleLikeComment}
                  onLoadReplies={handleLoadReplies}
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
