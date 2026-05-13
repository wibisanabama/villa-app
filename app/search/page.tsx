'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import styles from './search.module.css';

export default function SearchPage() {
  const [allVillas, setAllVillas] = useState<any[]>([]);
  const [displayedVillas, setDisplayedVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    loadVillas();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single();
      setUserProfile(profile);
    }
  };

  const loadVillas = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/villas');
      setAllVillas(data);
      setDisplayedVillas(data);
    } catch (error) {
      console.error('Failed to fetch villas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan saat login dengan Google.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setCheckIn('');
    setCheckOut('');
    setDisplayedVillas(allVillas);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      let filtered = [...allVillas];
      
      // Filter by text
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(query) || 
          (v.location && v.location.toLowerCase().includes(query))
        );
      }

      // Filter by availability if dates are set
      if (checkIn && checkOut) {
         if (new Date(checkIn) >= new Date(checkOut)) {
            alert('Tanggal check-out harus lebih besar dari check-in');
            setIsSearching(false);
            return;
         }

         const availableVillas = [];
         for (const villa of filtered) {
            try {
              const res = await fetchWithAuth(`/bookings/check-availability?villaId=${villa.id}&checkIn=${checkIn}&checkOut=${checkOut}`);
              if (res.available) {
                availableVillas.push(villa);
              }
            } catch (err) {
              console.error(`Check availability failed for villa ${villa.id}`);
            }
         }
         setDisplayedVillas(availableVillas);
      } else {
         setDisplayedVillas(filtered);
      }
    } catch (error) {
      console.error('Search error', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">Vilara</Link>
        </div>
        <div className={styles.navLinks}>
          {user ? (
             <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--foreground)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                  {(userProfile?.full_name || userProfile?.email || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 500 }}>{userProfile?.full_name || userProfile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'User'}</span>
             </Link>
          ) : (
             <button className="btn btn-outline" onClick={() => setShowLoginModal(true)}>Log In</button>
          )}
        </div>
      </header>

      <main className={styles.mainContent} style={{ justifyContent: 'flex-start', paddingTop: '3rem' }}>
        <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Cari Villa Impian Anda</h1>
        <p className={styles.heroSubtitle} style={{ marginBottom: '2rem' }}>
          Jelajahi koleksi properti terbaik yang tersedia untuk tanggal pilihan Anda.
        </p>

        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '3rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="label">Lokasi / Nama Villa</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Mau liburan ke mana?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="label">Check-in</label>
              <input 
                type="date" 
                className="input"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="label">Check-out</label>
              <input 
                type="date" 
                className="input" 
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.625rem 2rem' }}
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Mencari...' : 'Cari'}
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.625rem 1.5rem' }}
                onClick={handleReset}
                disabled={isSearching}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1000px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Daftar Villa Tersedia</h2>
            {!loading && <span style={{ color: 'var(--text-secondary)' }}>{displayedVillas.length} properti ditemukan</span>}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {loading || isSearching ? (
              // Placeholder Skeleton Card
              [1, 2, 3].map((item) => (
                <div key={item} style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ height: '200px', backgroundColor: '#e2e8f0', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ height: '1.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '70%', marginBottom: '0.75rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    <div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '100%', marginBottom: '0.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    <div style={{ height: '1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '40%', marginBottom: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '1.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '30%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                      <div style={{ height: '2rem', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '80px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : displayedVillas.length === 0 ? (
               <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Tidak ada villa yang ditemukan sesuai kriteria Anda.</p>
                 <button onClick={handleReset} className="btn btn-outline" style={{ marginTop: '1rem' }}>Reset Pencarian</button>
               </div>
            ) : (
               displayedVillas.map((villa) => (
                <div key={villa.id} style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ 
                    height: '200px', 
                    backgroundColor: '#e2e8f0', 
                    backgroundImage: `url(${villa.images && villa.images.length > 0 ? villa.images[0] : 'https://placehold.co/600x400?text=No+Image'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }}></div>
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{villa.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21C16 16.8 19 12.8428 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.8428 8 16.8 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {villa.location || 'Lokasi tidak diketahui'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {villa.description || 'Tidak ada deskripsi untuk villa ini.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>{formatPrice(villa.price_per_night)}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}> / malam</div>
                      </div>
                      <Link href={`/search/${villa.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Detail</Link>
                    </div>
                  </div>
                </div>
               ))
            )}
          </div>
        </div>
      </main>
      
      {/* Define global keyframes for skeleton loading if not already defined */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `
      }} />

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '90%', position: 'relative' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--foreground)' }}>Selamat Datang</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Masuk untuk melanjutkan ke dashboard atau membooking villa.</p>
            
            {loginError && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{loginError}</div>}

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '0.75rem', backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loginLoading ? 'Memproses...' : 'Masuk dengan Google'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
