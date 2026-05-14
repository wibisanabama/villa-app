'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '../../../lib/api';
import styles from './status.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const type = searchParams.get('type');
  const planSlug = searchParams.get('plan');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Subscription
  const [subSuccess, setSubSuccess] = useState(false);

  useEffect(() => {
    // --- Subscription payment return ---
    if (type === 'subscription') {
      const checkSub = async () => {
        try {
          const res = await fetchWithAuth('/subscriptions/me');
          if (res.subscription?.slug === planSlug) {
            setSubSuccess(true);
          }
        } catch { /* ignore */ } finally {
          setLoading(false);
        }
      };
      checkSub();
      const interval = setInterval(async () => {
        try {
          const res = await fetchWithAuth('/subscriptions/me');
          if (res.subscription?.slug === planSlug) {
            setSubSuccess(true);
            clearInterval(interval);
          }
        } catch { /* ignore */ }
      }, 3000);
      return () => clearInterval(interval);
    }

    // --- Booking payment return ---
    if (!bookingId) { setLoading(false); return; }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/status/${bookingId}`);
        const data = await res.json();
        setBooking(data.booking);
        setTransaction(data.transaction);
        setIsPaid(data.is_paid);
        setPaymentLink(data.payment_link);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/status/${bookingId}`);
        const data = await res.json();
        setBooking(data.booking);
        setTransaction(data.transaction);
        setIsPaid(data.is_paid);
        setPaymentLink(data.payment_link);
        if (data.is_paid) clearInterval(interval);
      } catch { /* ignore */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingId, type, planSlug]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Memeriksa status pembayaran...</p>
      </div>
    );
  }

  // --- Subscription result ---
  if (type === 'subscription') {
    return (
      <div className={styles.card}>
        {subSuccess ? (
          <>
            <div className={styles.iconSuccess}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 className={styles.title}>Upgrade Berhasil!</h1>
            <p className={styles.subtitle}>Paket langganan Anda telah berhasil diupgrade ke <strong>{planSlug?.replace(/^\w/, c => c.toUpperCase())}</strong>.</p>
            <Link href="/dashboard/subscription" className={styles.btnPrimary}>Kembali ke Dashboard</Link>
          </>
        ) : (
          <>
            <div className={styles.iconPending}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h1 className={styles.title}>Menunggu Pembayaran</h1>
            <p className={styles.subtitle}>Pembayaran Anda sedang diproses. Halaman ini akan otomatis diperbarui setelah pembayaran dikonfirmasi.</p>
            <div className={styles.pollingRow}>
              <span className={styles.pollingDot} />
              <span>Menunggu konfirmasi...</span>
            </div>
            <Link href="/dashboard/subscription" className={styles.btnOutline}>Kembali ke Dashboard</Link>
          </>
        )}
      </div>
    );
  }

  // --- No booking ---
  if (!booking) {
    return (
      <div className={styles.card}>
        <div className={styles.iconError}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        </div>
        <h1 className={styles.title}>Pesanan Tidak Ditemukan</h1>
        <p className={styles.subtitle}>Data pesanan yang Anda cari tidak tersedia.</p>
        <Link href="/search" className={styles.btnPrimary}>Cari Villa</Link>
      </div>
    );
  }

  // --- Booking payment result ---
  return (
    <div className={styles.card}>
      {isPaid ? (
        <>
          <div className={styles.iconSuccess}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className={styles.title}>Pembayaran Berhasil!</h1>
          <p className={styles.subtitle}>Pesanan Anda telah dikonfirmasi. Selamat menikmati liburan!</p>
        </>
      ) : (
        <>
          <div className={styles.iconPending}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <h1 className={styles.title}>Menunggu Pembayaran</h1>
          <p className={styles.subtitle}>Selesaikan pembayaran untuk mengkonfirmasi pemesanan Anda.</p>
        </>
      )}

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.row}><span>Villa</span><span>{booking.villas?.name || '-'}</span></div>
        <div className={styles.row}><span>Lokasi</span><span>{booking.villas?.location || '-'}</span></div>
        <div className={styles.row}><span>Check-in</span><span>{formatDate(booking.check_in_date)}</span></div>
        <div className={styles.row}><span>Check-out</span><span>{formatDate(booking.check_out_date)}</span></div>
        <div className={styles.row}><span>Tamu</span><span>{booking.guest_name}</span></div>
        <div className={`${styles.row} ${styles.rowTotal}`}><span>Total</span><span>{formatPrice(booking.total_price)}</span></div>
        <div className={styles.row}>
          <span>Status</span>
          <span className={`${styles.badge} ${isPaid ? styles.badgePaid : styles.badgePending}`}>
            {isPaid ? 'Lunas' : 'Belum Dibayar'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!isPaid && paymentLink && (
          <a href={paymentLink} className={styles.btnPrimary}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            Bayar Sekarang
          </a>
        )}
        {!isPaid && (
          <div className={styles.pollingRow}>
            <span className={styles.pollingDot} />
            <span>Halaman ini otomatis update setelah pembayaran</span>
          </div>
        )}
        <Link href="/profile" className={styles.btnOutline}>Lihat Riwayat Pesanan</Link>
        <Link href="/search" className={styles.btnGhost}>Cari Villa Lainnya</Link>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>Vilara</Link>
      </header>
      <main className={styles.main}>
        <Suspense fallback={
          <div className={styles.card}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Memuat...</p>
          </div>
        }>
          <PaymentStatusContent />
        </Suspense>
      </main>
    </div>
  );
}
