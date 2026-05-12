'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { assets } from '@/assets';
import styles from './Navbar.module.css';

const MOCK_NOTIFICATIONS = [
  { id: 1, avatar: assets.steveJobs, text: 'Steve Jobs liked your post', time: '2m ago' },
  { id: 2, avatar: assets.ryanRoslansky, text: 'Ryan Roslansky commented on your post', time: '15m ago' },
  { id: 3, avatar: assets.dylanField, text: 'Dylan Field sent you a friend request', time: '1h ago' },
  { id: 4, avatar: assets.radovanArena, text: 'Radovan SkillArena mentioned you in a comment', time: '3h ago' },
  { id: 5, avatar: assets.karimSaif, text: 'Karim Saif reacted to your photo', time: '5h ago' },
  { id: 6, avatar: assets.genericAvatar, text: 'You have a new follower', time: '1d ago' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={styles['navbar']}>
        <div className={styles['navbar-inner']}>
          {/* Left: Logo + Search */}
          <div className={styles['navbar-left']}>
            <Link href="/feed" className={styles['nav-logo']}>
              <Image src={assets.logo} alt="Buddy Script" width={120} height={36} />
            </Link>
            <div className={styles['search-wrap']}>
              <span className={styles['search-icon']}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input type="text" placeholder="Search..." className={styles['search-input']} />
            </div>
          </div>

          {/* Right: Nav icons + profile */}
          <div className={styles['navbar-right']}>
            {/* Home */}
            <Link href="/feed" className={styles['nav-icon-btn']} aria-label="Home">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </Link>

            {/* Friends */}
            <button type="button" className={styles['nav-icon-btn']} aria-label="Friends">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </button>

            {/* Notifications */}
            <div className={styles['nav-dropdown-wrap']} ref={notifRef}>
              <button
                type="button"
                className={styles['nav-icon-btn']}
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label="Notifications"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <span className={styles['badge']}>6+</span>
              </button>
              {notifOpen && (
                <div className={styles['dropdown']}>
                  <p className={styles['dropdown-title']}>Notifications</p>
                  <ul className={styles['notif-list']}>
                    {MOCK_NOTIFICATIONS.map(n => (
                      <li key={n.id} className={styles['notif-item']}>
                        <Image src={n.avatar || '/default-avatar.svg'} alt="" width={38} height={38} className={styles['notif-avatar']} />
                        <div className={styles['notif-body']}>
                          <p className={styles['notif-text']}>{n.text}</p>
                          <span className={styles['notif-time']}>{n.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chat */}
            <button type="button" className={styles['nav-icon-btn']} aria-label="Chat">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <span className={styles['badge']}>2</span>
            </button>

            {/* Profile dropdown */}
            <div className={styles['nav-dropdown-wrap']} ref={profileRef}>
              <button
                type="button"
                className={styles['profile-btn']}
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
              >
                <Image
                  src={user?.avatar ?? assets.profileFallback}
                  alt={fullName}
                  width={36}
                  height={36}
                  className={styles['profile-avatar']}
                />
                <span className={styles['profile-name']}>{fullName}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              {profileOpen && (
                <div className={styles['dropdown']} style={{ right: 0, left: 'auto', minWidth: '200px' }}>
                  <div className={styles['profile-info']}>
                    <Image
                      src={user?.avatar ?? assets.profileFallback}
                      alt={fullName}
                      width={44}
                      height={44}
                      className={styles['profile-avatar']}
                    />
                    <div>
                      <p className={styles['profile-info-name']}>{fullName}</p>
                      <p className={styles['profile-info-email']}>{user?.email}</p>
                    </div>
                  </div>
                  <ul className={styles['profile-menu']}>
                    <li><button type="button" className={styles['profile-menu-item']}>View Profile</button></li>
                    <li><button type="button" className={styles['profile-menu-item']}>Settings</button></li>
                    <li><button type="button" className={styles['profile-menu-item']}>Help &amp; Support</button></li>
                    <li>
                      <button type="button" className={`${styles['profile-menu-item']} ${styles['logout-btn']}`} onClick={handleLogout}>
                        Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className={styles['mobile-top']}>
        <Link href="/feed" className={styles['nav-logo']}>
          <Image src={assets.logo} alt="Buddy Script" width={100} height={30} />
        </Link>
        <button
          type="button"
          className={styles['mobile-search-btn']}
          onClick={() => setSearchOpen(o => !o)}
          aria-label="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
        {searchOpen && (
          <div className={styles['mobile-search-bar']}>
            <input type="text" placeholder="Search..." className={styles['search-input']} autoFocus />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className={styles['mobile-bottom']}>
        <Link href="/feed" className={styles['mobile-nav-btn']} aria-label="Home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>
        <button type="button" className={styles['mobile-nav-btn']} aria-label="Friends">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </button>
        <button type="button" className={`${styles['mobile-nav-btn']} ${styles['notif-wrap']}`} aria-label="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className={styles['badge']}>6+</span>
        </button>
        <button type="button" className={styles['mobile-nav-btn']} aria-label="Chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
        <button type="button" className={styles['mobile-nav-btn']} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
      </nav>
    </>
  );
}
