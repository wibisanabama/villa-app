import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { 
  getMyStaff, 
  getInvitations, 
  inviteStaff, 
  revokeInvitation, 
  removeStaff, 
  acceptInvitation 
} from '../controllers/staff.controller.js';

const router = express.Router();

// Semua rute staff membutuhkan autentikasi
router.use(requireAuth);

// Routes untuk Owner
router.get('/', getMyStaff);
router.get('/invitations', getInvitations);
router.post('/invite', inviteStaff);
router.delete('/invitations/:id', revokeInvitation);
router.delete('/:id', removeStaff); // Hapus dari villa_staff

// Routes untuk Calon Staff
router.post('/accept', acceptInvitation);

export default router;
