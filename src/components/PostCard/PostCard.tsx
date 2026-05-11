'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Post, Comment, Reply, User } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (postId: string, commentId: string) => void;
  onAddReply: (postId: string, commentId: string, content: string) => void;
  onLikeReply: (postId: string, commentId: string, replyId: string) => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (postId: string, newContent: string) => void;
  onToggleVisibility: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  onLikePost,
  onAddComment,
  onLikeComment,
  onAddReply,
  onLikeReply,
  onDeletePost,
  onEditPost,
  onToggleVisibility,
}: PostCardProps) {
  const isOwn = currentUser?.id === post.authorId;
  const isLiked = currentUser ? post.likes.some(l => l.userId === currentUser.id) : false;

  const [menuOpen, setMenuOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showLikes, setShowLikes] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
    setShowComments(true);
  };

  const handleEditSave = () => {
    if (editContent.trim()) {
      onEditPost(post.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const displayedComments = showAllComments ? post.comments : post.comments.slice(-2);
  const hiddenCount = post.comments.length - 2;

  return (
    <article className={styles['post-card']}>
      {/* Header */}
      <div className={styles['post-header']}>
        <Image
          src={post.authorAvatar}
          alt={post.authorName}
          width={44}
          height={44}
          className={styles['author-avatar']}
        />
        <div className={styles['author-info']}>
          <p className={styles['author-name']}>{post.authorName}</p>
          <p className={styles['post-meta']}>
            {timeAgo(post.createdAt)}
            <span className={styles['meta-dot']}>·</span>
            <span className={`${styles['visibility-badge']} ${post.isPublic ? styles['public'] : styles['private']}`}>
              {post.isPublic ? '🌐 Public' : '👥 Friends'}
            </span>
          </p>
        </div>
        <div className={styles['post-menu-wrap']} ref={menuRef}>
          <button
            type="button"
            className={styles['menu-btn']}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Post options"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <ul className={styles['post-menu']}>
              <li>
                <button type="button" className={styles['menu-item']} onClick={() => setMenuOpen(false)}>
                  🔖 Save Post
                </button>
              </li>
              <li>
                <button type="button" className={styles['menu-item']} onClick={() => setMenuOpen(false)}>
                  🔔 Turn On Notification
                </button>
              </li>
              <li>
                <button type="button" className={styles['menu-item']} onClick={() => setMenuOpen(false)}>
                  🚫 Hide Post
                </button>
              </li>
              {isOwn && (
                <>
                  <li className={styles['menu-divider']} />
                  <li>
                    <button
                      type="button"
                      className={styles['menu-item']}
                      onClick={() => { setIsEditing(true); setEditContent(post.content); setMenuOpen(false); }}
                    >
                      ✏️ Edit Post
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles['menu-item']}
                      onClick={() => { onToggleVisibility(post.id); setMenuOpen(false); }}
                    >
                      {post.isPublic ? '👥 Make Friends Only' : '🌐 Make Public'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`${styles['menu-item']} ${styles['menu-item-danger']}`}
                      onClick={() => { onDeletePost(post.id); setMenuOpen(false); }}
                    >
                      🗑️ Delete Post
                    </button>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles['post-content']}>
        {isEditing ? (
          <div className={styles['edit-wrap']}>
            <textarea
              className={styles['edit-textarea']}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles['edit-actions']}>
              <button type="button" className={styles['edit-cancel']} onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="button" className={styles['edit-save']} onClick={handleEditSave}>Save</button>
            </div>
          </div>
        ) : (
          <p className={styles['post-text']}>{post.content}</p>
        )}
        {post.image && !isEditing && (
          <div className={styles['post-image-wrap']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt="Post image" className={styles['post-image']} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={styles['post-stats']}>
        <button
          type="button"
          className={styles['like-count-btn']}
          onClick={() => setShowLikes(o => !o)}
        >
          <span className={styles['like-avatars']}>
            {post.likes.slice(0, 3).map((l, i) => (
              <span key={l.userId} className={styles['like-avatar-bubble']} style={{ zIndex: 3 - i }}>
                {l.userName.charAt(0)}
              </span>
            ))}
          </span>
          {post.likes.length > 0 && (
            <span className={styles['like-count']}>{post.likes.length}</span>
          )}
        </button>
        {showLikes && post.likes.length > 0 && (
          <div className={styles['likes-tooltip']}>
            {post.likes.map(l => <p key={l.userId} className={styles['likes-name']}>{l.userName}</p>)}
          </div>
        )}
        <div className={styles['stats-right']}>
          <button type="button" className={styles['stat-link']} onClick={() => { setShowComments(o => !o); }}>
            {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
          </button>
          <span className={styles['stat-link']}>0 Shares</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles['post-actions']}>
        <button
          type="button"
          className={`${styles['action-btn']} ${isLiked ? styles['action-liked'] : ''}`}
          onClick={() => currentUser && onLikePost(post.id)}
          disabled={!currentUser}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          Like
        </button>
        <button
          type="button"
          className={styles['action-btn']}
          onClick={() => setShowComments(o => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comment
        </button>
        <button type="button" className={styles['action-btn']}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>

      {/* Comment input */}
      {currentUser && (
        <div className={styles['comment-input-row']}>
          <Image
            src={currentUser.avatar}
            alt={currentUser.firstName}
            width={36}
            height={36}
            className={styles['comment-input-avatar']}
          />
          <div className={styles['comment-input-wrap']}>
            <input
              type="text"
              placeholder="Write a comment..."
              className={styles['comment-input']}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
            />
            <button type="button" className={styles['comment-send']} onClick={handleAddComment} disabled={!commentInput.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {showComments && post.comments.length > 0 && (
        <div className={styles['comments-section']}>
          {hiddenCount > 0 && !showAllComments && (
            <button
              type="button"
              className={styles['view-more-btn']}
              onClick={() => setShowAllComments(true)}
            >
              View {hiddenCount} previous comment{hiddenCount !== 1 ? 's' : ''}
            </button>
          )}
          {displayedComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={post.id}
              currentUser={currentUser}
              onLikeComment={onLikeComment}
              onAddReply={onAddReply}
              onLikeReply={onLikeReply}
            />
          ))}
        </div>
      )}
    </article>
  );
}

/* ─── CommentItem ─────────────────────────────────────────────── */

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUser: User | null;
  onLikeComment: (postId: string, commentId: string) => void;
  onAddReply: (postId: string, commentId: string, content: string) => void;
  onLikeReply: (postId: string, commentId: string, replyId: string) => void;
}

function CommentItem({ comment, postId, currentUser, onLikeComment, onAddReply, onLikeReply }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const isLiked = currentUser ? comment.likes.some(l => l.userId === currentUser.id) : false;

  const handleReply = () => {
    if (!replyInput.trim()) return;
    onAddReply(postId, comment.id, replyInput.trim());
    setReplyInput('');
    setShowReplies(true);
  };

  return (
    <div className={styles['comment-item']}>
      <Image
        src={comment.authorAvatar}
        alt={comment.authorName}
        width={36}
        height={36}
        className={styles['comment-avatar']}
      />
      <div className={styles['comment-body']}>
        <div className={styles['comment-bubble']}>
          <p className={styles['comment-author']}>{comment.authorName}</p>
          <p className={styles['comment-text']}>{comment.content}</p>
        </div>
        <div className={styles['comment-actions']}>
          <button
            type="button"
            className={`${styles['comment-action']} ${isLiked ? styles['comment-action-liked'] : ''}`}
            onClick={() => currentUser && onLikeComment(postId, comment.id)}
          >
            Like {comment.likes.length > 0 && <span className={styles['reaction-count']}>{comment.likes.length}</span>}
          </button>
          <button type="button" className={styles['comment-action']} onClick={() => setReplyOpen(o => !o)}>
            Reply
          </button>
          <span className={styles['comment-time']}>{timeAgo(comment.createdAt)}</span>
        </div>

        {replyOpen && currentUser && (
          <div className={styles['reply-input-row']}>
            <input
              type="text"
              placeholder={`Reply to ${comment.authorName}…`}
              className={styles['reply-input']}
              value={replyInput}
              onChange={e => setReplyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
              autoFocus
            />
            <button type="button" className={styles['comment-send']} onClick={handleReply} disabled={!replyInput.trim()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        )}

        {comment.replies.length > 0 && (
          <button type="button" className={styles['toggle-replies']} onClick={() => setShowReplies(o => !o)}>
            {showReplies ? 'Hide' : `View ${comment.replies.length}`} repl{comment.replies.length !== 1 ? 'ies' : 'y'}
          </button>
        )}

        {showReplies && comment.replies.map(reply => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            postId={postId}
            commentId={comment.id}
            currentUser={currentUser}
            onLikeReply={onLikeReply}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── ReplyItem ───────────────────────────────────────────────── */

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  commentId: string;
  currentUser: User | null;
  onLikeReply: (postId: string, commentId: string, replyId: string) => void;
}

function ReplyItem({ reply, postId, commentId, currentUser, onLikeReply }: ReplyItemProps) {
  const isLiked = currentUser ? reply.likes.some(l => l.userId === currentUser.id) : false;

  return (
    <div className={styles['reply-item']}>
      <Image
        src={reply.authorAvatar}
        alt={reply.authorName}
        width={30}
        height={30}
        className={styles['reply-avatar']}
      />
      <div className={styles['comment-body']}>
        <div className={styles['comment-bubble']}>
          <p className={styles['comment-author']}>{reply.authorName}</p>
          <p className={styles['comment-text']}>{reply.content}</p>
        </div>
        <div className={styles['comment-actions']}>
          <button
            type="button"
            className={`${styles['comment-action']} ${isLiked ? styles['comment-action-liked'] : ''}`}
            onClick={() => currentUser && onLikeReply(postId, commentId, reply.id)}
          >
            Like {reply.likes.length > 0 && <span className={styles['reaction-count']}>{reply.likes.length}</span>}
          </button>
          <span className={styles['comment-time']}>{timeAgo(reply.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
