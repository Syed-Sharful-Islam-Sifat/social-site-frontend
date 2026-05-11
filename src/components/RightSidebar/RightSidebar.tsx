'use client';

import { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets';
import styles from './RightSidebar.module.css';

const YOU_MIGHT_LIKE = [
  {
    id: 1,
    name: 'Radovan SkillArena',
    title: 'Founder & CEO at Trophy',
    avatar: assets.genericAvatar,
  },
  {
    id: 2,
    name: 'Karim Saif',
    title: 'Product Designer',
    avatar: assets.karimSaif,
  },
];

const FRIENDS = [
  { id: 1, name: 'Steve Jobs', avatar: assets.steveJobs, online: true },
  { id: 2, name: 'Ryan Roslansky', avatar: assets.ryanRoslansky, online: true },
  { id: 3, name: 'Dylan Field', avatar: assets.dylanField, online: false, lastSeen: '5 min ago' },
  { id: 4, name: 'Karim Saif', avatar: assets.karimSaif, online: true },
  { id: 5, name: 'Radovan SkillArena', avatar: assets.radovanArena, online: false, lastSeen: '1h ago' },
];

export default function RightSidebar() {
  const [friendSearch, setFriendSearch] = useState('');
  const [followed, setFollowed] = useState<Set<number>>(new Set());

  const filteredFriends = FRIENDS.filter(f =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const toggleFollow = (id: number) => {
    setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <aside className={styles['sidebar']}>
      {/* You Might Like */}
      <div className={styles['card']}>
        <h3 className={styles['card-title']}>You Might Like</h3>
        <ul className={styles['like-list']}>
          {YOU_MIGHT_LIKE.map(person => (
            <li key={person.id} className={styles['like-item']}>
              <Image
                src={person.avatar}
                alt={person.name}
                width={44}
                height={44}
                className={styles['like-avatar']}
              />
              <div className={styles['like-info']}>
                <p className={styles['like-name']}>{person.name}</p>
                <p className={styles['like-title']}>{person.title}</p>
              </div>
              <div className={styles['like-actions']}>
                <button type="button" className={styles['ignore-btn']}>Ignore</button>
                <button
                  type="button"
                  className={`${styles['follow-btn']} ${followed.has(person.id) ? styles['following'] : ''}`}
                  onClick={() => toggleFollow(person.id)}
                >
                  {followed.has(person.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Your Friends */}
      <div className={styles['card']}>
        <h3 className={styles['card-title']}>Your Friends</h3>
        <div className={styles['friends-search-wrap']}>
          <span className={styles['friends-search-icon']}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search friends..."
            className={styles['friends-search']}
            value={friendSearch}
            onChange={e => setFriendSearch(e.target.value)}
          />
        </div>
        <ul className={styles['friends-list']}>
          {filteredFriends.map(friend => (
            <li key={friend.id} className={styles['friend-item']}>
              <div className={styles['friend-avatar-wrap']}>
                <Image
                  src={friend.avatar}
                  alt={friend.name}
                  width={40}
                  height={40}
                  className={styles['friend-avatar']}
                />
                <span className={`${styles['status-dot']} ${friend.online ? styles['online'] : styles['offline']}`} />
              </div>
              <div className={styles['friend-info']}>
                <p className={styles['friend-name']}>{friend.name}</p>
                {friend.online ? (
                  <p className={styles['friend-status-online']}>Online</p>
                ) : (
                  <p className={styles['friend-status-offline']}>{friend.lastSeen}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
