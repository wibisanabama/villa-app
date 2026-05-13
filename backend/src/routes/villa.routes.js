import express from 'express';
import multer from 'multer';
import {
  getAllVillas,
  getVillaById,
  getMyVillas,
  createVilla,
  updateVilla,
  deleteVilla,
  uploadVillaImage
} from '../controllers/villa.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Setup Multer untuk upload file (disimpan di memory sebagai buffer)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
});

// ==========================================
// PUBLIC ROUTES (Tidak butuh login)
// ==========================================
router.get('/', getAllVillas);

// PENTING: Route statis HARUS sebelum route dinamis /:id
// Agar Express tidak salah mencocokkan "owner" sebagai ID villa.
// GET /:id juga PUBLIC agar guest bisa melihat detail villa.
router.get('/owner/me', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), getMyVillas);
router.get('/:id', getVillaById);

// ==========================================
// PROTECTED ROUTES (Membutuhkan Login)
// ==========================================

// GUEST juga boleh create villa (ini adalah alur "Daftar Sebagai Owner")
// Backend akan otomatis upgrade role dari GUEST -> OWNER setelah villa dibuat.
router.post('/', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN', 'GUEST']), createVilla);

router.put('/:id', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), updateVilla);
router.delete('/:id', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), deleteVilla);

// Endpoint upload gambar (menggunakan multer array 'images')
router.post(
  '/:id/images',
  requireAuth,
  requireRole(['OWNER', 'SUPER_ADMIN']),
  upload.array('images', 3),
  uploadVillaImage
);

export default router;
