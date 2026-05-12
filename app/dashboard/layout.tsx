'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'OWNER' || profile?.role === 'SUPER_ADMIN') {
        setUser(session.user);
        setLoading(false);
      } else {
        // Redirect unauthorized users
        router.replace('/callback');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>Vilara</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}>
            Dashboard
          </Link>
          <Link href="/dashboard/villas" className={`${styles.navItem} ${pathname.includes('/villas') ? styles.navItemActive : ''}`}>
            Properti Villa
          </Link>
          <Link href="/dashboard/staff" className={`${styles.navItem} ${pathname.includes('/staff') ? styles.navItemActive : ''}`}>
            Manajemen Staf
          </Link>
          <Link href="/dashboard/bookings" className={`${styles.navItem} ${pathname.includes('/bookings') ? styles.navItemActive : ''}`}>
            Pemesanan
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Overview</h2>
          </div>
          <div className={styles.topbarRight}>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Log Out
            </button>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{user?.email?.[0].toUpperCase() || 'A'}</div>
              <div>
                <div className={styles.userName}>{user?.user_metadata?.full_name || user?.email}</div>
                <div className={styles.userRole}>Owner</div>
              </div>
            </div>
          </div>
        </header>
        
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}

