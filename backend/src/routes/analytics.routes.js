import express from 'express';
import { getDashboardMetrics } from '../controllers/analytics.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Semua endpoint analitik wajib login dan hanya untuk OWNER / SUPER_ADMIN
router.use(requireAuth);
router.use(requireRole(['OWNER', 'SUPER_ADMIN']));

// Endpoint: GET /api/analytics
router.get('/', getDashboardMetrics);

export default router;
