'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './page.module.css';

export default function VillasPage() {
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price_per_night: '',
    capacity: '',
    description: ''
  });

  const loadVillas = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/villas/owner/me');
      setVillas(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data properti villa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVillas();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAuth('/villas', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price_per_night: Number(formData.price_per_night),
          capacity: Number(formData.capacity)
        })
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        location: '',
        price_per_night: '',
        capacity: '',
        description: ''
      });
      loadVillas();
    } catch (err: any) {
      alert(`Gagal menambah villa: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && villas.length === 0) {
    return <div>Memuat data properti...</div>;
  }

  if (error && villas.length === 0) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Manajemen Properti</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Tambah Villa Baru
        </button>
      </div>

      <div className={`card ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Properti</th>
              <th>Lokasi</th>
              <th>Harga / Malam</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {villas.length > 0 ? (
              villas.map(villa => (
                <tr key={villa.id}>
                  <td style={{fontWeight: 500}}>{villa.name}</td>
                  <td style={{color: 'var(--text-secondary)'}}>{villa.location}</td>
                  <td>Rp {villa.price_per_night?.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeActive}`}>Aktif</span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem', marginRight: '0.5rem'}}>Edit</button>
                    <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem', color: '#e74c3c', borderColor: '#fadbd8'}}>Hapus</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  Belum ada properti villa. Tambahkan villa pertama Anda!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tambah Villa Baru</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Properti</label>
                <input required type="text" name="name" className="input" value={formData.name} onChange={handleInputChange} placeholder="e.g. Villa Serenity" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lokasi</label>
                <input required type="text" name="location" className="input" value={formData.location} onChange={handleInputChange} placeholder="e.g. Ubud, Bali" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Harga per Malam (Rp)</label>
                <input required type="number" name="price_per_night" className="input" value={formData.price_per_night} onChange={handleInputChange} placeholder="e.g. 2500000" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kapasitas (Orang)</label>
                <input required type="number" name="capacity" className="input" value={formData.capacity} onChange={handleInputChange} placeholder="e.g. 4" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Deskripsi Singkat</label>
                <textarea name="description" className="input" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Ceritakan tentang properti Anda..." />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Properti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
