'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './page.module.css';

export default function BookingsPage() {
  const [villas, setVillas] = useState<any[]>([]);
  const [selectedVilla, setSelectedVilla] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      try {
        const res = await fetchWithAuth('/villas/owner/me');
        const villaData = res.data || [];
        setVillas(villaData);
        if (villaData.length > 0) {
          setSelectedVilla(villaData[0].id);
        }
      } catch (err) {
        console.error('Failed to load villas', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  useEffect(() => {
    if (!selectedVilla) return;
    async function loadBookings() {
      try {
        const res = await fetchWithAuth(`/bookings/villa/${selectedVilla}`);
        setBookings(res.data || []);
      } catch (err) {
        console.error('Failed to load bookings', err);
      }
    }
    loadBookings();
  }, [selectedVilla]);

  if (loading) {
    return <div>Memuat data pemesanan...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Daftar Pemesanan</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn btn-outline">List View</button>
          <button className="btn btn-primary">Calendar View</button>
        </div>
      </div>
      
      <div className={styles.filterBar}>
        <input type="text" className="input" placeholder="Cari nama tamu..." style={{maxWidth: '300px'}} />
        <select 
          className="input" 
          style={{maxWidth: '200px'}}
          value={selectedVilla}
          onChange={(e) => setSelectedVilla(e.target.value)}
        >
          {villas.length === 0 && <option value="">Tidak ada properti</option>}
          {villas.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select className="input" style={{maxWidth: '200px'}}>
          <option>Semua Status</option>
          <option>Confirmed</option>
          <option>Pending</option>
        </select>
      </div>
      
      <div className={`card`} style={{marginTop: '1.5rem'}}>
        <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)'}}>
              <th style={{padding: '1rem'}}>Tamu</th>
              <th style={{padding: '1rem'}}>Check-in</th>
              <th style={{padding: '1rem'}}>Check-out</th>
              <th style={{padding: '1rem'}}>Total Pembayaran</th>
              <th style={{padding: '1rem'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <tr key={b.id} style={{borderBottom: '1px solid var(--border)'}}>
                  <td style={{padding: '1rem', fontWeight: 500}}>{b.guest_name}</td>
                  <td style={{padding: '1rem'}}>{new Date(b.start_date).toLocaleDateString('id-ID')}</td>
                  <td style={{padding: '1rem'}}>{new Date(b.end_date).toLocaleDateString('id-ID')}</td>
                  <td style={{padding: '1rem'}}>Rp {b.total_price.toLocaleString('id-ID')}</td>
                  <td style={{padding: '1rem'}}>{b.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  Belum ada pemesanan untuk properti ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
