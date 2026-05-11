import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Selamat Datang</h1>
            <p className={styles.subtitle}>Masuk ke dashboard manajemen villa Anda</p>
          </div>
          
          <form>
            <div className={styles.formGroup}>
              <label htmlFor="email" className="label">Email Address</label>
              <input type="email" id="email" className="input" placeholder="admin@villa.com" required />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className="label">Password</label>
              <input type="password" id="password" className="input" placeholder="••••••••" required />
            </div>
            
            <button type="button" className={`btn btn-primary ${styles.submitBtn}`}>
              Masuk
            </button>
          </form>
          
          <p className={styles.footerText}>
            Belum memiliki akun SaaS? <Link href="/register" className={styles.link}>Daftar di sini</Link>
          </p>
        </div>
      </div>
      
      <div className={styles.visualSection}>
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>Kelola Villa dengan Mudah</h2>
          <p className={styles.visualText}>
            Satu platform untuk semua kebutuhan manajemen properti, pemesanan, dan analitik pendapatan Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
