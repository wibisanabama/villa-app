-- ==========================================
-- TABEL TAMBAHAN UNTUK MANAJEMEN STAF
-- ==========================================

-- 1. Tabel staff_invitations (Undangan Staf)
CREATE TABLE public.staff_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    villa_id UUID REFERENCES public.villas(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel villa_staff (Relasi Staf dan Villa)
CREATE TABLE public.villa_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    villa_id UUID REFERENCES public.villas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(villa_id, user_id) -- Mencegah duplikasi staf di villa yang sama
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villa_staff ENABLE ROW LEVEL SECURITY;

-- Policy untuk staff_invitations
-- Owner bisa melihat undangan yang mereka buat
CREATE POLICY "Owner can view their own invitations" ON public.staff_invitations FOR SELECT USING (auth.uid() = created_by);

-- Selebihnya ditangani menggunakan Supabase Admin (bypasses RLS) di sisi Node.js,
-- seperti pembuatan undangan dan penerimaan undangan.

-- Policy untuk villa_staff
-- Semua pengguna terautentikasi bisa melihat (karena dibutuhkan untuk inner join oleh admin/owner/tamu opsional)
CREATE POLICY "Authenticated users can view villa staff" ON public.villa_staff FOR SELECT USING (auth.role() = 'authenticated');
