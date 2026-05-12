import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/auth.controller.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
});

router.get('/me', requireAuth, getProfile);
router.put('/me', requireAuth, updateProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

export default router;
