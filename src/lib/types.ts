export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

export interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  replies: Reply[];
  repliesLoaded: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  visibility: 'public' | 'private';
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: Comment[];
  commentsLoaded: boolean;
  createdAt: string;
}
