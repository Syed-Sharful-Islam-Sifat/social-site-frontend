'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { assets } from '@/assets';
import styles from './Register.module.css';

export default function Register() {
  const { register, user, isLoading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/feed');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async () => {
    setError('');
    if (password !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the terms & conditions.');
      return;
    }
    setSubmitting(true);
    const result = await register(firstName, lastName, email, password);
    setSubmitting(false);
    if (result.ok) {
      router.push('/feed');
    } else {
      setError(result.error ?? 'Registration failed.');
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
              src={assets.registrationHero}
              alt="Register illustration"
              width={620}
              height={520}
              priority
              className={`${styles['hero-img']} ${styles['hero-light']}`}
            />
            <Image
              src={assets.registrationHeroDark}
              alt="Register illustration dark"
              width={620}
              height={520}
              priority
              className={`${styles['hero-img']} ${styles['hero-dark']}`}
            />
          </div>
          <div className={styles['form-col']}>
            <div className={styles['card']}>
              <div className={styles['logo']}>
                <Image src={assets.logo} alt="Buddy Script" width={140} height={42} />
              </div>
              <p className={styles['subtitle']}>Get Started Now</p>
              <h1 className={styles['title']}>Registration</h1>

              <button type="button" className={styles['google-btn']}>
                <Image src={assets.google} alt="Google" width={20} height={20} />
                <span>Register with google</span>
              </button>

              <div className={styles['divider']}><span>Or</span></div>

              <form
                onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                className={styles['form']}
              >
                {error && <p className={styles['error']}>{error}</p>}

                <div className={styles['name-row']}>
                  <div className={styles['form-group']}>
                    <label className={styles['label']}>First Name</label>
                    <input
                      type="text"
                      className={styles['input']}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles['form-group']}>
                    <label className={styles['label']}>Last Name</label>
                    <input
                      type="text"
                      className={styles['input']}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>

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
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Repeat Password</label>
                  <input
                    type="password"
                    className={styles['input']}
                    value={repeatPassword}
                    onChange={e => setRepeatPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <label className={styles['terms-label']}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className={styles['checkbox']}
                  />
                  I agree to terms &amp; conditions
                </label>

                <button type="submit" className={styles['submit-btn']} disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register now'}
                </button>
              </form>

              <p className={styles['bottom-text']}>
                Already have an account?{' '}
                <Link href="/login" className={styles['bottom-link']}>Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
