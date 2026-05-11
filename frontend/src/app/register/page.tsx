import Link from 'next/link';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Buat Akun</h1>
            <p className={styles.subtitle}>Mulai kelola properti villa Anda secara profesional</p>
          </div>
          
          <form>
            <div className={styles.formGroup}>
              <label htmlFor="name" className="label">Nama Lengkap</label>
              <input type="text" id="name" className="input" placeholder="Budi Santoso" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className="label">Email Address</label>
              <input type="email" id="email" className="input" placeholder="admin@villa.com" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className="label">Password</label>
              <input type="password" id="password" className="input" placeholder="••••••••" required />
            </div>
            
            <button type="button" className={`btn btn-primary ${styles.submitBtn}`}>
              Daftar Sekarang
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
