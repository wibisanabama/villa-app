'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });

      if (error) throw error;
      
      setSuccess(true);
      // Wait a bit then redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Buat Akun</h1>
            <p className={styles.subtitle}>Mulai kelola properti villa Anda secara profesional</p>
          </div>
          
          {error && <div className="alert error" style={{marginBottom: '1rem', color: 'red'}}>{error}</div>}
          {success && <div className="alert success" style={{marginBottom: '1rem', color: 'green'}}>Pendaftaran berhasil! Silakan periksa email Anda atau langsung login. Mengalihkan...</div>}
          
          <form onSubmit={handleRegister}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className="label">Nama Lengkap</label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} className="input" placeholder="Budi Santoso" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className="label">Email Address</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} className="input" placeholder="admin@villa.com" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className="label">Password</label>
              <input type="password" id="password" value={formData.password} onChange={handleChange} className="input" placeholder="••••••••" minLength={6} required />
            </div>
            
            <button type="submit" disabled={loading} className={`btn btn-primary ${styles.submitBtn}`}>
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
          
          <p className={styles.footerText}>
            Sudah memiliki akun? <Link href="/login" className={styles.link}>Masuk di sini</Link>
          </p>
        </div>
      </div>
      
      <div className={styles.visualSection}>
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>Tumbuhkan Bisnis Anda</h2>
          <p className={styles.visualText}>
            Tingkatkan okupansi dan dapatkan kontrol penuh atas manajemen harga dan pemesanan tamu.
          </p>
        </div>
      </div>
    </div>
  );
}
