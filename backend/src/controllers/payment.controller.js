import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const MAYAR_API_KEY = process.env.MAYAR_API_KEY || '';
// Mayar API URL (Sesuaikan dengan dokumentasi resmi Mayar terbaru)
const MAYAR_BASE_URL = 'https://api.mayar.id/hl/v1'; 

/**
 * API: Generate Payment Link dari Mayar.id
 * Endpoint: POST /api/payments/create-link
 */
export const createPaymentLink = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const guestId = req.user.id; // Pastikan guest yang membooking

    if (!MAYAR_API_KEY) {
      return res.status(500).json({ message: 'MAYAR_API_KEY belum dikonfigurasi di server' });
    }

    // 1. Ambil data booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, villas(name)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    // Hanya guest yang membuat booking yang bisa membayar (atau jika public booking, validasi dilewati)
    if (booking.guest_id && booking.guest_id !== guestId) {
      return res.status(403).json({ message: 'Forbidden: Ini bukan pesanan Anda' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: `Tidak dapat membayar pesanan dengan status ${booking.status}` });
    }

    // 2. Siapkan Payload untuk Mayar API
    const payload = {
      name: `Pembayaran Villa: ${booking.villas.name}`,
      description: `Check-in: ${booking.check_in_date} | Check-out: ${booking.check_out_date}`,
      amount: Number(booking.total_price),
      customer_name: booking.guest_name,
      customer_email: booking.guest_email,
      customer_phone: booking.guest_phone || '',
      // Atur redirect URL setelah pembayaran sukses (sesuaikan dengan URL frontend)
      redirect_url: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/bookings` : 'http://localhost:3000'
    };

    // 3. Panggil API Mayar.id untuk membuat link
    const response = await fetch(`${MAYAR_BASE_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAYAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const mayarData = await response.json();

    if (!response.ok) {
      console.error('Mayar Error:', mayarData);
      return res.status(response.status).json({ message: 'Gagal membuat link pembayaran Mayar', error: mayarData });
    }

    // URL pembayaran dari response Mayar (tergantung format respons Mayar, biasanya ada di data.link)
    const paymentLink = mayarData.data?.link || mayarData.link; 
    const mayarTransactionId = mayarData.data?.id || mayarData.id;

    // 4. Simpan data transaksi ke database Supabase
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          booking_id: booking.id,
          amount: booking.total_price,
          payment_link: paymentLink,
          mayar_transaction_id: mayarTransactionId,
          status: 'UNPAID'
        }
      ])
      .select()
      .single();

    if (txError) throw txError;

    res.json({
      message: 'Payment link berhasil dibuat',
      payment_link: paymentLink,
      transaction
    });

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pembayaran', error: error.message });
  }
};

/**
 * API: Webhook Listener untuk menerima notifikasi dari Mayar.id
 * Endpoint: POST /api/payments/webhook
 */
export const mayarWebhook = async (req, res) => {
  try {
    // Mayar akan mengirimkan payload saat status pembayaran berubah.
    const { status, id, amount, ...rest } = req.body;
    
    // NOTE: Di production, Anda HARUS memvalidasi signature webhook dari Mayar
    // untuk memastikan request benar-benar datang dari Mayar.id (menggunakan crypto/HMAC).
    
    // Asumsi status sukses di Mayar adalah 'SUCCESS' atau 'PAID'
    const isSuccess = status === 'SUCCESS' || status === 'PAID' || status === 'settled';

    if (isSuccess && id) {
      // 1. Update status di tabel transactions
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .update({ 
          status: 'PAID',
          paid_at: new Date().toISOString()
        })
        .eq('mayar_transaction_id', id) // Cocokkan dengan ID transaksi dari Mayar
        .select()
        .single();

      if (txError) {
        console.error('Webhook tx update error:', txError);
        return res.status(500).json({ message: 'Gagal update transaksi' });
      }

      // 2. Update status di tabel bookings menjadi CONFIRMED
      if (tx && tx.booking_id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'CONFIRMED' })
          .eq('id', tx.booking_id);

        if (bookingError) {
           console.error('Webhook booking update error:', bookingError);
        }
      }
    }

    // Selalu balas dengan 200 OK agar Mayar tahu webhook diterima dengan baik
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
