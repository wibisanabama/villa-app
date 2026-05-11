'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../lib/api';
import styles from './page.module.css';

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchWithAuth('/analytics');
        // Backend analytics controller returns the object directly, not wrapped in { data: ... }
        setData(response.data !== undefined ? response.data : response);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data analitik');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div>Memuat data analitik...</div>;
  }

  if (error) {
    return <div className="alert error">{error}</div>;
  }

  // Jika tidak ada data, gunakan default 0
  // Backend return shape: { totalRevenue, totalBookings, completedBookings, monthlyData }
  const metrics = data || {
    totalRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    monthlyData: []
  };

  return (
    <div>
      <div className={styles.statGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Total Pendapatan</div>
          <div className={styles.statValue}>Rp {metrics.totalRevenue.toLocaleString('id-ID')}</div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Total Pesanan</div>
          <div className={styles.statValue}>{metrics.totalBookings}</div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Pesanan Selesai</div>
          <div className={styles.statValue}>{metrics.completedBookings}</div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Dalam Proses</div>
          <div className={styles.statValue}>{metrics.totalBookings - metrics.completedBookings}</div>
        </div>
      </div>
      
      <div className={styles.chartSection}>
        <div className={`card ${styles.chartCard}`}>
          <h3 className={styles.sectionTitle}>Grafik Pendapatan</h3>
          <div className={styles.placeholderChart}>
            {/* Visualisasi sederhana untuk placeholder */}
          </div>
        </div>
        
        <div className={`card ${styles.chartCard}`}>
          <h3 className={styles.sectionTitle}>Pemesanan Terbaru</h3>
          <div className={styles.placeholderList}>
            {data?.recentBookings?.length > 0 ? (
              data.recentBookings.map((booking: any) => (
                <div key={booking.id} className={styles.listItem}>
                  <div>
                    <div style={{fontWeight: 500}}>{booking.guest_name}</div>
                    <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>{booking.villas?.name}</div>
                  </div>
                  <div style={{fontWeight: 600}}>Rp {booking.total_price.toLocaleString('id-ID')}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Belum ada pemesanan.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

