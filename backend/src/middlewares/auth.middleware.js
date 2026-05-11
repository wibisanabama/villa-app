import { supabase } from '../config/supabase.js';

/**
 * Middleware untuk memverifikasi JWT token dari Supabase.
 * Token harus dikirimkan di header Authorization: Bearer <token>
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifikasi token menggunakan Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error?.message });
    }

    // Attach user ke object request
    req.user = user;
    
    // Ambil user role dari tabel user_profiles untuk keperluan RBAC (Role-Based Access Control)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profileError && profile) {
      req.user.role = profile.role;
    } else {
       // Auto-create profile as OWNER for OAuth logins (SaaS tenant)
       req.user.role = 'OWNER';
       
       // Fire and forget insert (menggunakan service role key kalau bisa, tapi karena middleware berjalan sebagai user context atau service, kita coba insert biasa)
       await supabase.from('user_profiles').insert([
         {
           id: user.id,
           role: 'OWNER',
           full_name: user.user_metadata?.full_name || user.email,
           phone_number: user.user_metadata?.phone || null
         }
       ]);
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

/**
 * Middleware untuk mengecek apakah user memiliki role yang diizinkan.
 * Harus dipanggil setelah middleware `requireAuth`.
 * @param {string[]} allowedRoles Array of roles (e.g. ['SUPER_ADMIN', 'OWNER'])
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: User identity or role not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: This endpoint requires one of the following roles: ${allowedRoles.join(', ')}` });
    }

    next();
  };
};
