export const API = {
  auth: {
    me:       '/auth/me',
    login:    '/auth/login',
    register: '/auth/register',
    logout:   '/auth/logout',
  },
  posts: {
    feed:     '/posts',
    like:     (id: string) => `/posts/${id}/like`,
    likes:    (id: string) => `/posts/${id}/likes`,
    comments: (id: string) => `/posts/${id}/comments`,
  },
  comments: {
    like:    (id: string) => `/comments/${id}/like`,
    likes:   (id: string) => `/comments/${id}/likes`,
    replies: (id: string) => `/comments/${id}/replies`,
  },
  replies: {
    like:  (id: string) => `/replies/${id}/like`,
    likes: (id: string) => `/replies/${id}/likes`,
  },
};
