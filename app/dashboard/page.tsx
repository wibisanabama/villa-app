import styles from './page.module.css';

export default function DashboardOverview() {
  return (
    <div>
      <div className={styles.statGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Total Pendapatan</div>
          <div className={styles.statValue}>Rp 45.000.000</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            ↑ 12.5% bulan ini
          </div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Tingkat Okupansi</div>
          <div className={styles.statValue}>85%</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            ↑ 5% bulan ini
          </div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Pemesanan Aktif</div>
          <div className={styles.statValue}>24</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            ↑ 4 bulan ini
          </div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statTitle}>Menunggu Konfirmasi</div>
          <div className={styles.statValue}>3</div>
          <div className={`${styles.statChange} ${styles.negative}`}>
            Butuh tindakan segera
          </div>
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
            <div className={styles.listItem}>
              <div>
                <div style={{fontWeight: 500}}>Budi Santoso</div>
                <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Villa A - 3 Malam</div>
              </div>
              <div style={{fontWeight: 600}}>Rp 3.5M</div>
            </div>
            <div className={styles.listItem}>
              <div>
                <div style={{fontWeight: 500}}>Siti Aminah</div>
                <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Villa B - 2 Malam</div>
              </div>
              <div style={{fontWeight: 600}}>Rp 2.0M</div>
            </div>
            <div className={styles.listItem}>
              <div>
                <div style={{fontWeight: 500}}>Andi Wijaya</div>
                <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Villa C - 5 Malam</div>
              </div>
              <div style={{fontWeight: 600}}>Rp 6.5M</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
