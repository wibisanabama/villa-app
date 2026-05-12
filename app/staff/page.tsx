import styles from '../page.module.css';
import Link from 'next/link';

export default function StaffApp() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Staff App</h1>
          <p>Selamat datang di Staff App. Di sini Anda dapat mengelola operasional villa harian.</p>
        </div>
        <div className={styles.ctas}>
          <Link href="/search" className={styles.secondary}>Logout</Link>
        </div>
      </main>
    </div>
  );
}
