'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { assets } from '@/assets';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormData) => {
    const ok = await login(data.email, data.password);
    if (!ok) {
      setError('root', { message: 'Invalid email or password.' });
    } else {
      router.push('/feed');
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

              <form onSubmit={handleSubmit(onSubmit)} className={styles['form']}>
                {errors.root && <p className={styles['error']}>{errors.root.message}</p>}

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    className={`${styles['input']} ${errors.email ? styles['input-error'] : ''}`}
                    {...register('email')}
                  />
                  {errors.email && <p className={styles['field-error']}>{errors.email.message}</p>}
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className={`${styles['input']} ${errors.password ? styles['input-error'] : ''}`}
                    {...register('password')}
                  />
                  {errors.password && <p className={styles['field-error']}>{errors.password.message}</p>}
                </div>

                <div className={styles['form-options']}>
                  <label className={styles['remember-me']}>
                    <input type="checkbox" className={styles['checkbox']} />
                    Remember me
                  </label>
                  <span className={styles['forgot-link']}>Forgot password?</span>
                </div>

                <button type="submit" className={styles['submit-btn']} disabled={isSubmitting}>
                  {isSubmitting ? 'Logging in…' : 'Login now'}
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
