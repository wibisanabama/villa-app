import express from 'express';
import { createPaymentLink, mayarWebhook } from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Endpoint untuk generate payment link (hanya bisa diakses oleh tamu yang login/auth)
router.post('/create-link', requireAuth, createPaymentLink);

// Endpoint webhook publik yang akan dipanggil oleh server Mayar.id
router.post('/webhook', mayarWebhook);

export default router;
