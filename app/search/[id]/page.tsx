'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import styles from '../../portal/portal.module.css';

export default function VillaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Unwrap the params Promise using React.use() as required in Next.js 15+
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [villa, setVilla] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [user, setUser] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch villa details
        const villaData = await fetchWithAuth(`/villas/${id}`);
        setVilla(villaData);

        // Check auth status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          // Autofill profile
          const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setGuestName(profile.full_name || '');
            setGuestEmail(profile.email || session.user.email || '');
            setGuestPhone(profile.phone_number || '');
          } else {
            setGuestEmail(session.user.email || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail villa');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  // Calculate total price when dates change
  useEffect(() => {
    if (checkIn && checkOut && villa) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (start < end) {
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        setTotalPrice(nights * villa.price_per_night);
      } else {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, villa]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Silakan login terlebih dahulu untuk melakukan pemesanan.');
      router.push('/login');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      // Create booking
      const response = await fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          villa_id: id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone
        })
      });

      setBookingSuccess(true);
      // Wait a bit before redirecting to dashboard bookings or payment
      setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 2000);

    } catch (err: any) {
      setBookingError(err.message || 'Terjadi kesalahan saat membuat pesanan.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.header}>
          <div className={styles.logo}><Link href="/portal">Villa SaaS</Link></div>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, height: '60vh' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Memuat data villa...</div>
        </div>
      </div>
    );
  }

  if (error || !villa) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.header}>
          <div className={styles.logo}><Link href="/portal">Villa SaaS</Link></div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, height: '60vh', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Villa Tidak Ditemukan</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'Data villa yang Anda cari tidak tersedia.'}</p>
          <Link href="/search" className="btn btn-primary">Kembali ke Pencarian</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/portal">Villa SaaS</Link>
        </div>
        <div className={styles.navLinks}>
          {user ? (
             <Link href="/dashboard" className="btn btn-outline">Dashboard Saya</Link>
          ) : (
             <Link href="/login" className="btn btn-outline">Log In</Link>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
        <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
          &larr; Kembali ke daftar
        </Link>

        {/* Gallery Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', height: '400px', marginBottom: '2rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ 
            backgroundColor: '#e2e8f0', 
            backgroundImage: `url(${villa.images && villa.images.length > 0 ? villa.images[0] : 'https://placehold.co/800x600?text=Foto+Utama'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100%'
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              flex: 1, 
              backgroundColor: '#cbd5e1',
              backgroundImage: `url(${villa.images && villa.images.length > 1 ? villa.images[1] : 'https://placehold.co/400x300?text=Foto+2'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <div style={{ 
              flex: 1, 
              backgroundColor: '#cbd5e1',
              backgroundImage: `url(${villa.images && villa.images.length > 2 ? villa.images[2] : 'https://placehold.co/400x300?text=Foto+3'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
          
          {/* Left Column: Details */}
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{villa.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21C16 16.8 19 12.8428 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.8428 8 16.8 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {villa.location}
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tentang Villa Ini</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {villa.description || 'Belum ada deskripsi yang ditambahkan oleh pemilik villa.'}
              </p>
            </div>

            {villa.facilities && villa.facilities.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Fasilitas Utama</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {villa.facilities.map((fac: string, idx: number) => (
                    <div key={idx} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--foreground)' }}>
                      {fac}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Dikelola oleh</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {(villa.user_profiles?.full_name || villa.user_profiles?.email || 'O').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{villa.user_profiles?.full_name || villa.user_profiles?.email || 'Owner'}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Host Terverifikasi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'sticky', top: '2rem', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{formatPrice(villa.price_per_night)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>/ malam</span>
              </div>

              {bookingSuccess ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pesanan Berhasil!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Mengalihkan ke halaman riwayat pesanan...</p>
                </div>
              ) : (
                <form onSubmit={handleBooking}>
                  {bookingError && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{bookingError}</div>}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Check-In</label>
                      <input type="date" required className="input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Check-Out</label>
                      <input type="date" required className="input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Nama Tamu</label>
                    <input type="text" required className="input" placeholder="Nama lengkap" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Email Tamu</label>
                    <input type="email" required className="input" placeholder="email@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Nomor Telepon</label>
                    <input type="tel" required className="input" placeholder="08123456789" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                  </div>

                  {totalPrice > 0 && (
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        <span>{formatPrice(villa.price_per_night)} x {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24))} malam</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem', marginTop: '0.5rem', color: 'var(--foreground)' }}>
                        <span>Total Bayar</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.875rem' }}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Memproses...' : 'Pesan Sekarang'}
                  </button>

                  {!user && (
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                      Anda akan diminta untuk login/daftar sebelum menyelesaikan pesanan.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
