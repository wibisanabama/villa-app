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
                <button className={styles.actionBtn}>Edit</button>
                <button className={styles.actionBtn}>Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
