import styles from '../page.module.css';
import Link from 'next/link';

export default function GuestPortal() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Guest Portal</h1>
          <p>Selamat datang di Guest Portal. Di sini Anda dapat mencari dan memesan villa.</p>
        </div>
        <div className={styles.ctas}>
          <Link href="/portal/become-owner" className={styles.primary}>Daftarkan Villa Anda</Link>
          <Link href="/login" className={styles.secondary}>Logout</Link>
        </div>
      </main>
    </div>
  );
}
