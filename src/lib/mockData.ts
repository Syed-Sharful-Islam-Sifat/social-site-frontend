import { Post } from './types';
import { assets } from '@/assets';

export const SEED_POSTS: Post[] = [
  {
    id: 'post-seed-1',
    authorId: 'user-seed-karim',
    authorName: 'Karim Saif',
    authorAvatar: assets.karimSaif,
    content: 'Healthy Tracking App — A new way to monitor your wellness journey. Built with love and modern tech. Check it out!',
    image: assets.timelineImg,
    isPublic: true,
    likes: [
      { userId: 'user-seed-steve', userName: 'Steve Jobs' },
      { userId: 'user-seed-ryan', userName: 'Ryan Roslansky' },
      { userId: 'user-seed-dylan', userName: 'Dylan Field' },
    ],
    comments: [
      {
        id: 'comment-seed-1',
        authorId: 'user-seed-radovan',
        authorName: 'Radovan SkillArena',
        authorAvatar: assets.radovanArena,
        content:
          'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
        likes: [{ userId: 'user-seed-karim', userName: 'Karim Saif' }],
        createdAt: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
        replies: [
          {
            id: 'reply-seed-1',
            authorId: 'user-seed-karim',
            authorName: 'Karim Saif',
            authorAvatar: assets.karimSaif,
            content: 'Thanks! Glad you noticed that.',
            likes: [],
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-seed-2',
    authorId: 'user-seed-ryan',
    authorName: 'Ryan Roslansky',
    authorAvatar: assets.ryanRoslansky,
    content:
      'Excited to share the latest platform updates. Big things are coming for the professional community. Stay tuned!',
    isPublic: true,
    likes: [{ userId: 'user-seed-dylan', userName: 'Dylan Field' }],
    comments: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-seed-3',
    authorId: 'user-seed-dylan',
    authorName: 'Dylan Field',
    authorAvatar: assets.dylanField,
    content:
      'Design is not just what it looks like and feels like. Design is how it works. — Steve Jobs',
    isPublic: false,
    likes: [],
    comments: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];
