'use client';

import Image from 'next/image';
import { assets } from '@/assets';
import styles from './LeftSidebar.module.css';

const EXPLORE_ITEMS = [
  { icon: '🎓', label: 'Learning' },
  { icon: '💡', label: 'Insights' },
  { icon: '🔍', label: 'Find friends' },
  { icon: '🔖', label: 'Bookmarks' },
  { icon: '👥', label: 'Group' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '💾', label: 'Save post' },
];

const SUGGESTED_PEOPLE = [
  { id: 1, name: 'Steve Jobs', title: 'CEO at Apple', avatar: assets.steveJobs },
  { id: 2, name: 'Ryan Roslansky', title: 'CEO at LinkedIn', avatar: assets.ryanRoslansky },
  { id: 3, name: 'Dylan Field', title: 'CEO at Figma', avatar: assets.dylanField },
];

const EVENTS = [
  {
    id: 1,
    image: assets.feedEvent1,
    date: '10 Jul',
    title: 'No more terrorism no more cry',
    going: 17,
  },
  {
    id: 2,
    image: assets.feedEvent1,
    date: '15 Aug',
    title: 'Tech Innovation Summit 2026',
    going: 42,
  },
];

export default function LeftSidebar() {
  return (
    <aside className={styles['sidebar']}>
      {/* Explore */}
      <div className={styles['card']}>
        <h3 className={styles['card-title']}>Explore</h3>
        <ul className={styles['explore-list']}>
          {EXPLORE_ITEMS.map(item => (
            <li key={item.label}>
              <button type="button" className={styles['explore-item']}>
                <span className={styles['explore-icon']}>{item.icon}</span>
                <span className={styles['explore-label']}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggested People */}
      <div className={styles['card']}>
        <h3 className={styles['card-title']}>Suggested People</h3>
        <ul className={styles['people-list']}>
          {SUGGESTED_PEOPLE.map(person => (
            <li key={person.id} className={styles['person-item']}>
              <Image
                src={person.avatar}
                alt={person.name || 'Person'}
                width={44}
                height={44}
                className={styles['person-avatar']}
              />
              <div className={styles['person-info']}>
                <p className={styles['person-name']}>{person.name}</p>
                <p className={styles['person-title']}>{person.title}</p>
              </div>
              <button type="button" className={styles['connect-btn']}>Connect</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Events */}
      <div className={styles['card']}>
        <h3 className={styles['card-title']}>Events</h3>
        <ul className={styles['events-list']}>
          {EVENTS.map(event => (
            <li key={event.id} className={styles['event-item']}>
              <div className={styles['event-img-wrap']}>
                <Image
                  src={event.image}
                  alt={event.title || 'Event'}
                  width={80}
                  height={64}
                  className={styles['event-img']}
                />
                <span className={styles['event-date']}>{event.date}</span>
              </div>
              <div className={styles['event-info']}>
                <p className={styles['event-title']}>{event.title}</p>
                <p className={styles['event-going']}>{event.going} People Going</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
