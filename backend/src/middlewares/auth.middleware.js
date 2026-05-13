import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware untuk memverifikasi JWT token dari Supabase.
 * Token harus dikirimkan di header Authorization: Bearer <token>
 * 
 * PENTING: Menggunakan supabaseAdmin (service role) agar query ke user_profiles
 * tidak terblokir oleh RLS. Ini adalah operasi server-side yang trusted.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifikasi token menggunakan Supabase Auth (admin bypasses RLS)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error?.message });
    }

    // Attach user ke object request
    req.user = user;
    
    // Ambil user role dari tabel user_profiles untuk keperluan RBAC (Role-Based Access Control)
    // Menggunakan supabaseAdmin agar tidak terblokir RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profileError && profile) {
      req.user.role = profile.role;
    } else {
       // Auto-create profile as GUEST for OAuth logins
       req.user.role = 'GUEST';
       
       const emailName = user.email ? user.email.split('@')[0] : 'User';

       // Fire and forget insert
       await supabaseAdmin.from('user_profiles').insert([
         {
           id: user.id,
           role: 'GUEST',
           email: user.email,
           full_name: emailName,
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
