'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../lib/api';
import styles from './become-owner.module.css';

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price_per_night: '',
    capacity: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth('/villas', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price_per_night: Number(formData.price_per_night),
          capacity: Number(formData.capacity)
        })
      });
      // Berhasil daftar villa pertama -> Role otomatis jadi OWNER
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftarkan villa.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
          &larr; Kembali ke Profil
        </Link>
        <h1 className={styles.title}>Daftar Sebagai Owner</h1>
        <p className={styles.subtitle}>Masukkan detail properti pertama Anda untuk memulai.</p>
        
        {error && <div className="alert error" style={{marginBottom: '1rem', color: 'red'}}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className="label">Nama Properti</label>
            <input required type="text" name="name" className="input" value={formData.name} onChange={handleChange} placeholder="e.g. Villa Serenity" />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Lokasi</label>
            <input required type="text" name="location" className="input" value={formData.location} onChange={handleChange} placeholder="e.g. Ubud, Bali" />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Harga per Malam (Rp)</label>
            <input required type="number" name="price_per_night" className="input" value={formData.price_per_night} onChange={handleChange} placeholder="e.g. 2500000" />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Kapasitas (Orang)</label>
            <input required type="number" name="capacity" className="input" value={formData.capacity} onChange={handleChange} placeholder="e.g. 4" />
          </div>
          <div className={styles.formGroup}>
            <label className="label">Deskripsi Singkat</label>
            <textarea name="description" className="input" value={formData.description} onChange={handleChange} rows={4} placeholder="Ceritakan tentang properti Anda..." />
          </div>
          
          <button type="submit" disabled={loading} className={`btn btn-primary ${styles.submitBtn}`}>
            {loading ? 'Menyimpan...' : 'Daftar & Buat Properti'}
          </button>
        </form>
      </div>
    </div>
  );
}
