'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from '../page.module.css';

export default function StaffApp() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/search');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Staff App</h1>
          <p>Selamat datang di Staff App. Di sini Anda dapat mengelola operasional villa harian.</p>
        </div>
        <div className={styles.ctas}>
          <button onClick={handleLogout} className={styles.secondary}>Logout</button>
        </div>
      </main>
    </div>
  );
}
