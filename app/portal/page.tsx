import Link from 'next/link';
import styles from './portal.module.css';

export default function GuestPortal() {
  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>Villa SaaS</div>
        <div className={styles.navLinks}>
          <Link href="/login" className="btn btn-outline">Log In Owner</Link>
        </div>
      </header>

      <main className={styles.mainContent}>
        <h1 className={styles.heroTitle}>Temukan Pengalaman Menginap Terbaik</h1>
        <p className={styles.heroSubtitle}>
          Eksplorasi koleksi villa premium kami atau bergabunglah sebagai mitra untuk mengelola properti Anda sendiri.
        </p>

        <div className={styles.actionCards}>
          <div className={styles.actionCard}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Cari Villa</h2>
            <p className={styles.cardText}>Lihat daftar villa yang tersedia, periksa ketersediaan tanggal, dan pesan liburan impian Anda.</p>
            <Link href="/search" className="btn btn-primary" style={{ width: '100%' }}>Mulai Pencarian</Link>
          </div>

          <div className={styles.actionCard}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 15H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Pemilik Properti?</h2>
            <p className={styles.cardText}>Kelola villa Anda, atur ketersediaan kalender, dan dapatkan laporan analitik dari satu dashboard.</p>
            <Link href="/portal/become-owner" className="btn btn-outline" style={{ width: '100%' }}>Daftarkan Villa</Link>
          </div>
        </div>
      </main>
    </div>
  );
}