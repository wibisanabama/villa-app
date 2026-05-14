import express from 'express';
import { createPaymentLink, createSubscriptionPayment, getPaymentStatus, mayarWebhook } from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Endpoint untuk generate payment link (hanya bisa diakses oleh user yang login/auth)
router.post('/create-link', requireAuth, createPaymentLink);

// Endpoint untuk generate payment link upgrade subscription
router.post('/subscription', requireAuth, createSubscriptionPayment);

// Endpoint untuk cek status pembayaran
router.get('/status/:booking_id', getPaymentStatus);

// Endpoint webhook publik yang akan dipanggil oleh server Mayar.id
router.post('/webhook', mayarWebhook);

export default router;
