import { supabaseAdmin, supabase } from '../config/supabase.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const MAYAR_API_KEY = process.env.MAYAR_API_KEY || '';
const MAYAR_WEBHOOK_TOKEN = process.env.MAYAR_WEBHOOK_TOKEN || '';
const MAYAR_BASE_URL = process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const client = supabaseAdmin || supabase;

/**
 * Helper: Panggil Mayar Invoice API
 */
async function createMayarInvoice({ name, email, phone, description, amount, redirectUrl, expiredAt }) {
  const payload = {
    name,
    email,
    mobile: phone || '6200000000000',
    description,
    redirectUrl,
    expiredAt: expiredAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        quantity: 1,
        rate: Number(amount),
        description
      }
    ]
  };

  const response = await fetch(`${MAYAR_BASE_URL}/invoice/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAYAR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || data.statusCode >= 400) {
    console.error('Mayar API Error:', JSON.stringify(data));
    throw new Error(data.messages || data.message || 'Gagal membuat invoice Mayar');
  }

  return data;
}

/**
 * POST /api/payments/create-link
 * Generate Mayar payment link untuk booking villa
 */
export const createPaymentLink = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const guestId = req.user.id;

    if (!MAYAR_API_KEY) {
      return res.status(500).json({ message: 'MAYAR_API_KEY belum dikonfigurasi di server' });
    }

    // 1. Ambil data booking
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('*, villas(name)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    if (booking.guest_id && booking.guest_id !== guestId) {
      return res.status(403).json({ message: 'Forbidden: Ini bukan pesanan Anda' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: `Tidak dapat membayar pesanan dengan status ${booking.status}` });
    }

    // Cek apakah sudah ada transaction UNPAID untuk booking ini
    const { data: existingTx } = await client
      .from('transactions')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('status', 'UNPAID')
      .single();

    if (existingTx && existingTx.payment_link) {
      return res.json({
        message: 'Payment link sudah ada',
        payment_link: existingTx.payment_link,
        transaction: existingTx
      });
    }

    // 2. Buat invoice di Mayar
    const mayarRes = await createMayarInvoice({
      name: booking.guest_name,
      email: booking.guest_email,
      phone: booking.guest_phone,
      description: `Booking Villa: ${booking.villas.name} | Check-in: ${booking.check_in_date} | Check-out: ${booking.check_out_date}`,
      amount: booking.total_price,
      redirectUrl: `${FRONTEND_URL}/payment/status?booking_id=${booking_id}`
    });

    const paymentLink = mayarRes.data?.link;
    const mayarTransactionId = mayarRes.data?.id || mayarRes.data?.transactionId;

    // 3. Simpan transaksi
    const { data: transaction, error: txError } = await client
      .from('transactions')
      .insert([{
        booking_id: booking.id,
        amount: booking.total_price,
        payment_link: paymentLink,
        mayar_transaction_id: mayarTransactionId,
        status: 'UNPAID'
      }])
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
 * POST /api/payments/subscription
 * Generate Mayar payment link untuk upgrade subscription
 */
export const createSubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_slug } = req.body;

    if (!MAYAR_API_KEY) {
      return res.status(500).json({ message: 'MAYAR_API_KEY belum dikonfigurasi di server' });
    }

    // 1. Ambil target plan
    const { data: plan, error: planError } = await client
      .from('subscriptions')
      .select('*')
      .eq('slug', plan_slug)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ message: 'Paket tidak ditemukan' });
    }

    if (plan.price <= 0) {
      // Free plan — langsung upgrade tanpa bayar
      await client
        .from('user_profiles')
        .update({ subscription_id: plan.id })
        .eq('id', userId);

      return res.json({
        message: `Berhasil beralih ke paket ${plan.name}`,
        subscription: plan,
        payment_required: false
      });
    }

    // 2. Ambil data user
    const { data: profile } = await client
      .from('user_profiles')
      .select('email, full_name, phone_number')
      .eq('id', userId)
      .single();

    // 3. Buat invoice di Mayar
    const mayarRes = await createMayarInvoice({
      name: profile?.full_name || profile?.email || 'Owner',
      email: profile?.email || '',
      phone: profile?.phone_number,
      description: `Langganan Vilara: Paket ${plan.name} (${plan.max_villas === -1 ? 'Unlimited' : plan.max_villas + ' villa'})`,
      amount: plan.price,
      redirectUrl: `${FRONTEND_URL}/payment/status?type=subscription&plan=${plan_slug}`
    });

    const paymentLink = mayarRes.data?.link;
    const mayarTransactionId = mayarRes.data?.id || mayarRes.data?.transactionId;

    // 4. Simpan di transactions dengan metadata subscription
    const { data: transaction, error: txError } = await client
      .from('transactions')
      .insert([{
        booking_id: null,
        amount: plan.price,
        payment_link: paymentLink,
        mayar_transaction_id: mayarTransactionId,
        payment_method: 'subscription',
        status: 'UNPAID'
      }])
      .select()
      .single();

    if (txError) throw txError;

    // Simpan mapping transaksi <-> subscription sementara di metadata
    // Kita gunakan field yang ada: payment_method untuk tipe, dan kita tambah reference
    await client
      .from('transactions')
      .update({ payment_method: `subscription:${plan.slug}:${userId}` })
      .eq('id', transaction.id);

    res.json({
      message: 'Payment link berhasil dibuat',
      payment_link: paymentLink,
      payment_required: true,
      transaction
    });

  } catch (error) {
    console.error('Subscription Payment Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pembayaran', error: error.message });
  }
};

/**
 * GET /api/payments/status/:booking_id
 * Cek status pembayaran untuk suatu booking
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const { data: transaction } = await client
      .from('transactions')
      .select('*')
      .eq('booking_id', booking_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: booking } = await client
      .from('bookings')
      .select('*, villas(name, location)')
      .eq('id', booking_id)
      .single();

    res.json({
      booking,
      transaction,
      is_paid: transaction?.status === 'PAID',
      payment_link: transaction?.payment_link
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil status pembayaran', error: error.message });
  }
};

/**
 * POST /api/payments/webhook
 * Webhook Listener dari Mayar.id
 */
export const mayarWebhook = async (req, res) => {
  try {
    const signature = req.headers['authorization'] || req.headers['x-mayar-signature'];
    
    // Verifikasi Signature (Tergantung dari dokumen Mayar, ini asumsi menggunakan Authorization Header = Bearer TOKEN)
    if (MAYAR_WEBHOOK_TOKEN && signature !== `Bearer ${MAYAR_WEBHOOK_TOKEN}` && signature !== MAYAR_WEBHOOK_TOKEN) {
      console.error('⚠️ Invalid Webhook Signature');
      return res.status(401).json({ message: 'Invalid Signature' });
    }

    const payload = req.body;
    const event = payload.event;

    console.log('📩 Mayar Webhook received:', JSON.stringify(payload, null, 2));

    // Handle payment.received event
    if (event === 'payment.received' || event === 'payment.settled') {
      const data = payload.data;
      const mayarId = data?.id || data?.transactionId;
      const status = data?.status;

      if (!mayarId) {
        console.log('⚠️ No transaction ID in webhook payload');
        return res.status(200).json({ message: 'No transaction ID, skipped' });
      }

      // 1. Cari transaksi di DB
      const { data: tx, error: txError } = await client
        .from('transactions')
        .select('*')
        .eq('mayar_transaction_id', mayarId)
        .single();

      if (txError || !tx) {
        console.log(`⚠️ Transaction not found for Mayar ID: ${mayarId}`);
        return res.status(200).json({ message: 'Transaction not found' });
      }

      // 2. Update status transaksi
      await client
        .from('transactions')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString()
        })
        .eq('id', tx.id);

      // 3. Cek apakah ini booking payment atau subscription payment
      if (tx.payment_method && tx.payment_method.startsWith('subscription:')) {
        // Parse: subscription:plan_slug:user_id
        const parts = tx.payment_method.split(':');
        const planSlug = parts[1];
        const userId = parts[2];

        // Get plan
        const { data: plan } = await client
          .from('subscriptions')
          .select('id')
          .eq('slug', planSlug)
          .single();

        if (plan && userId) {
          await client
            .from('user_profiles')
            .update({ subscription_id: plan.id })
            .eq('id', userId);
          console.log(`✅ Subscription upgraded to ${planSlug} for user ${userId}`);
        }
      } else if (tx.booking_id) {
        // Booking payment — update booking status
        await client
          .from('bookings')
          .update({ status: 'CONFIRMED' })
          .eq('id', tx.booking_id);
        console.log(`✅ Booking ${tx.booking_id} confirmed via payment`);
      }
    }

    // Selalu balas 200 OK
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(200).json({ message: 'Webhook error handled', error: error.message });
  }
};
