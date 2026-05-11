import Link from "next/link";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>Villa SaaS</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
            Dashboard
          </Link>
          <Link href="/dashboard/villas" className={styles.navItem}>
            Properti Villa
          </Link>
          <Link href="/dashboard/bookings" className={styles.navItem}>
            Pemesanan
          </Link>
          <Link href="/dashboard/finance" className={styles.navItem}>
            Keuangan
          </Link>
          <Link href="/dashboard/settings" className={styles.navItem}>
            Pengaturan
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Overview</h2>
          </div>
          <div className={styles.topbarRight}>
            <button className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Log Out
            </button>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>A</div>
              <div>
                <div className={styles.userName}>Admin User</div>
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
