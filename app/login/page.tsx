'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Selamat Datang</h1>
            <p className={styles.subtitle}>Masuk ke dashboard manajemen villa Anda</p>
          </div>
          
          {error && <div className="alert error" style={{marginBottom: '1rem', color: 'red'}}>{error}</div>}
          
          <form onSubmit={handleEmailLogin}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className="label">Email Address</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} className="input" placeholder="admin@villa.com" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className="label">Password</label>
              <input type="password" id="password" value={formData.password} onChange={handleChange} className="input" placeholder="••••••••" required />
            </div>
            
            <button type="submit" disabled={loading} className={`btn btn-primary ${styles.submitBtn}`}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
            <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>atau</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          </div>

          <div className={styles.authActions}>
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`btn btn-outline ${styles.submitBtn}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>
          </div>
          
          <p className={styles.footerText}>
            Belum memiliki akun SaaS? <Link href="/register" className={styles.link}>Daftar di sini</Link>
          </p>
        </div>
      </div>
      
      <div className={styles.visualSection}>
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>Kelola Villa dengan Mudah</h2>
          <p className={styles.visualText}>
            Satu platform untuk semua kebutuhan manajemen properti, pemesanan, dan analitik pendapatan Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
