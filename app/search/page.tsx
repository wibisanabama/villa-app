import Link from 'next/link';
import styles from '../portal/portal.module.css'; // Reusing portal styles for consistency

export default function SearchPage() {
  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/portal">Vilara</Link>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className="btn btn-outline">Log In Owner</Link>
        </div>
      </header>

      <main className={styles.mainContent} style={{ justifyContent: 'flex-start', paddingTop: '3rem' }}>
        <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Cari Villa Impian Anda</h1>
        <p className={styles.heroSubtitle} style={{ marginBottom: '2rem' }}>
          Jelajahi koleksi properti terbaik yang tersedia untuk tanggal pilihan Anda.
        </p>

        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '3rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="label">Lokasi / Nama Villa</label>
              <input type="text" className="input" placeholder="Mau liburan ke mana?" />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="label">Check-in</label>
              <input type="date" className="input" />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="label">Check-out</label>
              <input type="date" className="input" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" style={{ padding: '0.625rem 2rem' }}>Cari</button>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1000px', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>*Fitur pencarian dan daftar villa sedang dalam tahap pengembangan Frontend.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Placeholder Skeleton Card */}
            {[1, 2, 3].map((item) => (
              <div key={item} style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ height: '200px', backgroundColor: '#e2e8f0' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ height: '1.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '70%', marginBottom: '0.75rem' }}></div>
                  <div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '100%', marginBottom: '0.5rem' }}></div>
                  <div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '40%', marginBottom: '1.5rem' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ height: '1.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '30%' }}></div>
                    <div style={{ height: '2rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '80px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
