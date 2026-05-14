'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { fetchWithAuth } from '../../lib/api';
import styles from '../search/search.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

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
          setFullName(profile.full_name || profile.email?.split('@')[0] || '');
          setPhoneNumber(profile.phone_number || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchWithAuth('/bookings/my-bookings');
        setBookings(Array.isArray(data) ? data : []);
      } catch { /* ignore */ } finally {
        setBookingsLoading(false);
      }
    };
    if (user) loadBookings();
  }, [user]);

  const handlePay = async (bookingId: string) => {
    setPayingBookingId(bookingId);
    try {
      const res = await fetchWithAuth('/payments/create-link', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId })
      });
      if (res.payment_link) {
        window.location.href = res.payment_link;
      }
    } catch (err: any) {
      alert(`Gagal membuat link pembayaran: ${err.message}`);
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/search');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update basic profile info
      await fetchWithAuth('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber
        })
      });

      // 2. Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        await fetchWithAuth('/auth/me/avatar', {
          method: 'POST',
          body: formData
        });
      }

      setSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
      
      // Reload profile
      const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
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

  // Tentukan gambar profil mana yang akan ditampilkan
  const displayAvatar = userProfile?.avatar_url;
  const initial = (userProfile?.full_name || userProfile?.email || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">Vilara</Link>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>
        <Link href="/search" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kembali ke Pencarian
        </Link>

        <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Info Akun</h1>
        
        {success && <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>{success}</div>}
        {error && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

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
              boxShadow: 'var(--shadow-sm)', overflow: 'hidden', position: 'relative'
            }}>
              {displayAvatar ? (
                 <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                 initial
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} style={{ marginBottom: '2.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Foto Profil Baru (Opsional)</label>
                  <input type="file" accept="image/*" className="input" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} style={{ padding: '0.4rem' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Nama Lengkap / Username</label>
                  <input type="text" required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label">Nomor Telepon (Opsional)</label>
                  <input type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08123456789" />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => {setIsEditing(false); setAvatarFile(null);}} disabled={saving}>
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                      {userProfile?.full_name || userProfile?.email?.split('@')[0] || user?.email?.split('@')[0]}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{userProfile?.email || user.email}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    Edit Profil
                  </button>
                </div>
                
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
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Menu Utama</h3>
              
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
            </div>

            {/* Pesanan Saya */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Pesanan Saya</h3>
              {bookingsLoading ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Memuat pesanan...</p>
              ) : bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <p style={{ marginBottom: '1rem' }}>Anda belum memiliki pesanan.</p>
                  <Link href="/search" className="btn btn-primary">Cari Villa</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bookings.map((b: any) => {
                    const statusColors: Record<string, { bg: string; color: string; label: string }> = {
                      PENDING: { bg: '#fef9c3', color: '#92400e', label: 'Menunggu Pembayaran' },
                      CONFIRMED: { bg: '#dcfce7', color: '#166534', label: 'Dikonfirmasi' },
                      CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Dibatalkan' },
                      COMPLETED: { bg: '#e0e7ff', color: '#3730a3', label: 'Selesai' }
                    };
                    const st = statusColors[b.status] || statusColors.PENDING;

                    return (
                      <div key={b.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem 1.25rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', gap: '1rem', flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{b.villas?.name || 'Villa'}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(b.check_in_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {new Date(b.check_out_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600 }}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(b.total_price)}
                          </span>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                          {b.status === 'PENDING' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                              disabled={payingBookingId === b.id}
                              onClick={() => handlePay(b.id)}
                            >
                              {payingBookingId === b.id ? 'Memproses...' : 'Bayar Sekarang'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Logout */}
            <div style={{ paddingTop: '2rem', marginTop: '1rem' }}>
              <button 
                onClick={handleLogout} 
                className="btn btn-outline" 
                style={{ width: '100%', borderColor: '#f87171', color: '#b91c1c' }}
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