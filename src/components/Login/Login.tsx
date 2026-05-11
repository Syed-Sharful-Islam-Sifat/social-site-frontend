'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { assets } from '@/assets';
import styles from './Login.module.css';

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/feed');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) {
      router.push('/feed');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <section className={styles['wrapper']}>
      <div className={styles['shape-one']}>
        <Image src={assets.shape1} alt="" width={420} height={420} className={styles['shape-light']} />
        <Image src={assets.darkShape} alt="" width={420} height={420} className={styles['shape-dark']} />
      </div>
      <div className={styles['shape-two']}>
        <Image src={assets.shape2} alt="" width={280} height={280} className={styles['shape-light']} />
        <Image src={assets.darkShape1} alt="" width={280} height={280} className={`${styles['shape-dark']} ${styles['shape-dark-opacity']}`} />
      </div>
      <div className={styles['shape-three']}>
        <Image src={assets.shape3} alt="" width={220} height={220} className={styles['shape-light']} />
        <Image src={assets.darkShape2} alt="" width={220} height={220} className={`${styles['shape-dark']} ${styles['shape-dark-opacity']}`} />
      </div>

      <div className={styles['container']}>
        <div className={styles['row']}>
          <div className={styles['image-col']}>
            <Image
              src={assets.loginHero}
              alt="Login illustration"
              width={620}
              height={520}
              priority
              className={styles['hero-img']}
            />
          </div>
          <div className={styles['form-col']}>
            <div className={styles['card']}>
              <div className={styles['logo']}>
                <Image src={assets.logo} alt="Buddy Script" width={140} height={42} />
              </div>
              <p className={styles['subtitle']}>Welcome back</p>
              <h1 className={styles['title']}>Login to your account</h1>

              <button type="button" className={styles['google-btn']}>
                <Image src={assets.google} alt="Google" width={20} height={20} />
                <span>Or sign-in with google</span>
              </button>

              <div className={styles['divider']}><span>Or</span></div>

              <form
                onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                className={styles['form']}
              >
                {error && <p className={styles['error']}>{error}</p>}

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Email</label>
                  <input
                    type="email"
                    className={styles['input']}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Password</label>
                  <input
                    type="password"
                    className={styles['input']}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className={styles['form-options']}>
                  <label className={styles['remember-me']}>
                    <input type="checkbox" className={styles['checkbox']} />
                    Remember me
                  </label>
                  <span className={styles['forgot-link']}>Forgot password?</span>
                </div>

                <button type="submit" className={styles['submit-btn']} disabled={submitting}>
                  {submitting ? 'Logging in…' : 'Login now'}
                </button>
              </form>

              <p className={styles['bottom-text']}>
                Don&apos;t have an account?{' '}
                <Link href="/register" className={styles['bottom-link']}>Create New Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
