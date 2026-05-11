import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * Route untuk mendapatkan detail profil user yang sedang login
 * Endpoint: GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // req.user di-set oleh requireAuth middleware
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        role,
        full_name,
        phone_number,
        created_at,
        subscriptions (
          id,
          name,
          features
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(404).json({ message: 'User profile not found in database', error: error.message });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        ...profile
      }
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ message: 'Error retrieving profile data' });
  }
});

export default router;
