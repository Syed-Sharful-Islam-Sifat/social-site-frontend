'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { assets } from '@/assets';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
import styles from './Register.module.css';

export default function Register() {
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: RegisterFormData) => {
    const result = await authRegister(data.firstName, data.lastName, data.email, data.password);
    if (result.ok) {
      router.push('/feed');
    } else if (result.field === 'email') {
      setError('email', { message: result.error });
    } else {
      setError('root', { message: result.error ?? 'Registration failed.' });
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

              <form onSubmit={handleSubmit(onSubmit)} className={styles['form']}>
                {errors.root && <p className={styles['error']}>{errors.root.message}</p>}

                <div className={styles['name-row']}>
                  <div className={styles['form-group']}>
                    <label className={styles['label']}>First Name</label>
                    <input
                      type="text"
                      autoComplete="given-name"
                      className={`${styles['input']} ${errors.firstName ? styles['input-error'] : ''}`}
                      {...register('firstName')}
                    />
                    {errors.firstName && <p className={styles['field-error']}>{errors.firstName.message}</p>}
                  </div>
                  <div className={styles['form-group']}>
                    <label className={styles['label']}>Last Name</label>
                    <input
                      type="text"
                      autoComplete="family-name"
                      className={`${styles['input']} ${errors.lastName ? styles['input-error'] : ''}`}
                      {...register('lastName')}
                    />
                    {errors.lastName && <p className={styles['field-error']}>{errors.lastName.message}</p>}
                  </div>
                </div>

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
                    autoComplete="new-password"
                    className={`${styles['input']} ${errors.password ? styles['input-error'] : ''}`}
                    {...register('password')}
                  />
                  {errors.password && <p className={styles['field-error']}>{errors.password.message}</p>}
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['label']}>Repeat Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={`${styles['input']} ${errors.repeatPassword ? styles['input-error'] : ''}`}
                    {...register('repeatPassword')}
                  />
                  {errors.repeatPassword && <p className={styles['field-error']}>{errors.repeatPassword.message}</p>}
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['terms-label']}>
                    <input
                      type="checkbox"
                      className={styles['checkbox']}
                      {...register('agreed')}
                    />
                    I agree to terms &amp; conditions
                  </label>
                  {errors.agreed && <p className={styles['field-error']}>{errors.agreed.message}</p>}
                </div>

                <button type="submit" className={styles['submit-btn']} disabled={isSubmitting}>
                  {isSubmitting ? 'Registering…' : 'Register now'}
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
