export const API = {
  auth: {
    me:       '/auth/me',
    login:    '/auth/login',
    register: '/auth/register',
    logout:   '/auth/logout',
  },
  posts: {
    feed: '/posts',
  },
} as const;
