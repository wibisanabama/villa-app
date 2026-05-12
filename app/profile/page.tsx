'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from '../search/search.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/search');
          return;
        }

        setUser(session.user);
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/search');
  };

  if (loading) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.header}>
          <div className={styles.logo}><Link href="/">Vilara</Link></div>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, height: '60vh' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Memuat info akun...</div>
        </div>
      </div>
    );
  }

  if (!user) return null; // Will redirect

  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">Vilara</Link>
        </div>
        <div className={styles.navLinks}>
          <Link href="/search" className="btn btn-outline">Kembali ke Pencarian</Link>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem', width: '100%', flex: 1 }}>
        <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Info Akun</h1>
        
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Cover Header */}
          <div style={{ height: '120px', backgroundColor: 'var(--primary)', opacity: 0.8 }}></div>
          
          <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--surface)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', 
              color: 'var(--primary)', border: '4px solid var(--surface)',
              marginTop: '-50px', marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
            }}>
              {user.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                 (userProfile?.full_name || userProfile?.email || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile Info */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                {userProfile?.full_name || userProfile?.email?.split('@')[0] || user?.email?.split('@')[0]}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{userProfile?.email || user.email}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Role Akun</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{userProfile?.role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.role === 'OWNER' ? 'Pemilik Properti (Owner)' : userProfile?.role === 'STAFF' ? 'Staf Pengelola' : 'Pengguna Biasa (Guest)'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nomor Telepon</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{userProfile?.phone_number || '-'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tindakan</h3>
              
              {userProfile?.role === 'GUEST' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#e0e7ff', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.25rem' }}>Ingin Menyewakan Properti?</h4>
                    <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>Daftarkan villa Anda dan mulai dapatkan penghasilan tambahan.</p>
                  </div>
                  <Link href="/become-owner" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Daftarkan Villa Anda
                  </Link>
                </div>
              )}

              {(userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#e0e7ff', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.25rem' }}>Manajemen Properti</h4>
                    <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>Kelola villa, pesanan, dan analitik Anda di Dashboard.</p>
                  </div>
                  <Link href="/dashboard" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Buka Dashboard
                  </Link>
                </div>
              )}

              {userProfile?.role === 'STAFF' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#e0e7ff', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.25rem' }}>Portal Staf</h4>
                    <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>Lihat tugas dan operasional harian villa.</p>
                  </div>
                  <Link href="/staff" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Buka Portal Staf
                  </Link>
                </div>
              )}

              <button 
                onClick={handleLogout} 
                className="btn btn-outline" 
                style={{ width: '100%', borderColor: '#f87171', color: '#b91c1c', marginTop: '1rem' }}
              >
                Keluar (Logout)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}