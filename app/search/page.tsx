'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '../../lib/api';
import styles from './search.module.css';

export default function SearchPage() {
  const [allVillas, setAllVillas] = useState<any[]>([]);
  const [displayedVillas, setDisplayedVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadVillas();
  }, []);

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
          <Link href="/login" className="btn btn-outline">Log In</Link>
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
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.625rem 2rem' }}
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Mencari...' : 'Cari'}
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
                 <button onClick={() => {setSearchQuery(''); setCheckIn(''); setCheckOut(''); setDisplayedVillas(allVillas);}} className="btn btn-outline" style={{ marginTop: '1rem' }}>Reset Pencarian</button>
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
    </div>
  );
}
