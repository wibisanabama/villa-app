import express from 'express';
import {
  checkAvailability,
  createBooking,
  getVillaBookings,
  getMyBookings,
  updateBookingStatus
} from '../controllers/booking.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Atau Guest)
// ==========================================

// Endpoint untuk mengecek ketersediaan villa di rentang tanggal tertentu
router.get('/check-availability', checkAvailability);

// Opsional: Guest bisa membuat booking tanpa token penuh jika diizinkan (atau dengan token basic)
// Kita bungkus dengan requireAuth tapi secara opsional di middleware jika kita membolehkan guest tanpa akun.
// Namun di setup kita saat ini, requireAuth mewajibkan token.
// Jika ingin guest tanpa akun bisa membooking, kita perlu logic khusus (misal middleware `optionalAuth`).
// Untuk sekarang, kita asumsikan membuat pesanan butuh login atau token yang valid.
router.post('/', requireAuth, createBooking); 

// ==========================================
// PROTECTED ROUTES (Membutuhkan Login)
// ==========================================

// Endpoint untuk Tamu melihat pesanannya sendiri
router.get('/my-bookings', requireAuth, getMyBookings);

// Endpoint untuk Owner melihat pesanan di vilanya
router.get('/villa/:villaId', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), getVillaBookings);

// Endpoint untuk update status pesanan (Owner/Guest)
router.put('/:id/status', requireAuth, updateBookingStatus);

export default router;
