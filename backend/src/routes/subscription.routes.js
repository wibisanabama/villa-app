import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { getAllPlans, getMySubscription, upgradePlan } from '../controllers/subscription.controller.js';

const router = express.Router();

// Public: Lihat semua paket
router.get('/', getAllPlans);

// Protected: Lihat paket langganan saya
router.get('/me', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), getMySubscription);

// Protected: Upgrade paket
router.post('/upgrade', requireAuth, requireRole(['OWNER', 'SUPER_ADMIN']), upgradePlan);

export default router;
