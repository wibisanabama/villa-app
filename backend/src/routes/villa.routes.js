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
// PUBLIC ROUTES
// ==========================================
router.get('/', getAllVillas);
router.get('/:id', getVillaById);

// ==========================================
// PROTECTED ROUTES (Membutuhkan Login)
// ==========================================
router.use(requireAuth);

// Endpoint khusus Owner/Super Admin
router.get('/owner/me', requireRole(['OWNER', 'SUPER_ADMIN']), getMyVillas);
router.post('/', requireRole(['OWNER', 'SUPER_ADMIN']), createVilla);

// Endpoint dinamis dengan ID (harus di bawah route statis seperti /owner/me)
router.put('/:id', requireRole(['OWNER', 'SUPER_ADMIN']), updateVilla);
router.delete('/:id', requireRole(['OWNER', 'SUPER_ADMIN']), deleteVilla);

// Endpoint upload gambar (menggunakan multer array 'images')
router.post(
  '/:id/images',
  requireRole(['OWNER', 'SUPER_ADMIN']),
  upload.array('images', 3),
  uploadVillaImage
);

export default router;
