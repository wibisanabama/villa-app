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
        router.replace('/search');
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'OWNER' || profile?.role === 'SUPER_ADMIN') {
        setUser({ ...session.user, full_name: profile.full_name });
        setLoading(false);
      } else {
        // Redirect unauthorized users
        router.replace('/callback');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/search');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  const displayName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Owner';

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>Vilara</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.navItemActive : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/villas" className={`${styles.navItem} ${pathname.includes('/villas') ? styles.navItemActive : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Properti Villa
          </Link>
          <Link href="/dashboard/staff" className={`${styles.navItem} ${pathname.includes('/staff') ? styles.navItemActive : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Manajemen Staf
          </Link>
          <Link href="/dashboard/bookings" className={`${styles.navItem} ${pathname.includes('/bookings') ? styles.navItemActive : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Pemesanan
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {pathname === '/dashboard' && 'Overview'}
              {pathname.includes('/villas') && 'Properti Villa'}
              {pathname.includes('/staff') && 'Manajemen Staf'}
              {pathname.includes('/bookings') && 'Pemesanan'}
              {pathname.includes('/profile') && 'Profil Saya'}
            </h2>
          </div>
          <div className={styles.topbarRight}>
            <Link
              href="/dashboard/profile"
              className={`${styles.userProfile} ${pathname.includes('/profile') ? styles.userProfileActive : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <div className={styles.avatar}>{displayName[0].toUpperCase()}</div>
              <div>
                <div className={styles.userName}>{displayName}</div>
                <div className={styles.userRole}>Owner</div>
              </div>
            </Link>
          </div>
        </header>
        
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
