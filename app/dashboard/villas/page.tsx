'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './page.module.css';

export default function VillasPage() {
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVillas() {
      try {
        const response = await fetchWithAuth('/villas/owner/me');
        setVillas(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data properti villa');
      } finally {
        setLoading(false);
      }
    }
    
    loadVillas();
  }, []);

  if (loading) {
    return <div>Memuat data properti...</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Manajemen Properti</h2>
        <button className="btn btn-primary">
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
    </div>
  );
}
