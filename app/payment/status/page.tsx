'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '../../../lib/api';
import styles from '../../search/search.module.css';

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const type = searchParams.get('type');
  const plan = searchParams.get('plan');

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (bookingId) {
          const res = await fetchWithAuth(`/payments/status/${bookingId}`);
          setStatusData(res);
        } else if (type === 'subscription') {
          // Placeholder for subscription check if needed, 
          // or just show success if returning from Mayar assuming success.
          // In a real app we'd have a specific endpoint to check subscription status.
          setStatusData({ is_subscription: true, plan });
        } else {
          setError('Invalid parameters');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal mengecek status pembayaran');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [bookingId, type, plan]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p>Mengecek status pembayaran...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '1rem' }}>Terjadi Kesalahan</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
        <Link href="/search" className="btn btn-primary">Kembali ke Beranda</Link>
      </div>
    );
  }

  const isPaid = statusData?.is_paid || statusData?.is_subscription;

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', border: '1px solid var(--border)' }}>
      {isPaid ? (
        <>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Pembayaran Berhasil!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {statusData?.is_subscription 
              ? `Terima kasih! Langganan paket ${plan} Anda telah aktif.` 
              : 'Terima kasih, pembayaran pesanan villa Anda telah kami terima.'}
          </p>
        </>
      ) : (
        <>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef9c3', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Menunggu Pembayaran</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Kami belum menerima konfirmasi pembayaran Anda. Jika Anda sudah membayar, silakan tunggu beberapa saat atau refresh halaman ini.
          </p>
          {statusData?.payment_link && (
            <a href={statusData.payment_link} className="btn btn-primary" style={{ marginBottom: '1rem', display: 'inline-block' }}>
              Lanjutkan Pembayaran
            </a>
          )}
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link href="/dashboard" className="btn btn-outline" style={{ width: '100%', maxWidth: '300px' }}>
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className={styles.portalContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">Vilara</Link>
        </div>
      </header>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Memuat...</div>}>
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}
