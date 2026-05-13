'use client';

import Image from 'next/image';
import { assets } from '@/assets';
import styles from './Stories.module.css';

const STORIES = [
  { id: 1, name: 'Steve Jobs', avatar: assets.storyCardPpl1, image: assets.storyImg1 },
  { id: 2, name: 'Ryan Roslansky', avatar: assets.storyCardPpl2, image: assets.storyImg2 },
  { id: 3, name: 'Dylan Field', avatar: assets.storyCardPpl3, image: assets.storyImg3 },
  { id: 4, name: 'Karim Saif', avatar: assets.storyCardPpl4, image: assets.storyImg4 },
];

export default function Stories() {
  return (
    <div className={styles['stories-wrap']}>
      <div className={styles['stories-list']}>
        {STORIES.map(story => (
          <button key={story.id} type="button" className={styles['story-card']}>
            <div className={styles['story-bg']}>
              <Image
                src={story.image}
                alt={story.name || 'Story'}
                fill
                className={styles['story-img']}
                sizes="120px"
              />
            </div>
            <div className={styles['story-avatar-ring']}>
              <Image
                src={story.avatar}
                alt={story.name || 'Story'}
                width={36}
                height={36}
                className={styles['story-avatar']}
              />
            </div>
            <span className={styles['story-name']}>{story.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
