import { User, Post } from './types';

const USERS_KEY = 'bs_users';
const CURRENT_USER_KEY = 'bs_current_user';
const POSTS_KEY = 'bs_posts';

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, id);
  }
}

export function getCurrentUser(): User | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find(u => u.id === id) ?? null;
}

export function getPosts(): Post[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(POSTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePosts(posts: Post[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}
