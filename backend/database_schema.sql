-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Subscriptions (Paket SaaS)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Users (Ekstensi dari auth.users Supabase)
-- Supabase menangani autentikasi dasar di skema `auth`. Kita membuat tabel profil publik ini untuk menyimpan data tambahan dan role.
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(50) CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'STAFF', 'GUEST')) DEFAULT 'OWNER',
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(50),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Villas (Properti)
CREATE TABLE public.villas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    price_per_night DECIMAL(10,2) NOT NULL,
    facilities JSONB, -- Array of strings (contoh: ["WiFi", "Kolam Renang"])
    images JSONB, -- Array of image URLs dari Supabase Storage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Bookings (Reservasi)
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    villa_id UUID REFERENCES public.villas(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL, -- Bisa null jika tamu memesan tanpa membuat akun
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Transactions (Pembayaran Mayar.id)
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100),
    payment_link VARCHAR(255), -- Link tagihan dari Mayar.id
    status VARCHAR(50) CHECK (status IN ('UNPAID', 'PAID', 'FAILED', 'EXPIRED')) DEFAULT 'UNPAID',
    mayar_transaction_id VARCHAR(255), -- ID referensi unik dari Mayar.id
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Mengaktifkan RLS untuk setiap tabel
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Policy untuk user_profiles (Pengguna melihat/edit profilnya sendiri)
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Policy untuk villas
-- Siapapun (publik) bisa melihat data villa
CREATE POLICY "Anyone can view villas" ON public.villas FOR SELECT USING (true);
-- Hanya Owner yang bisa membuat, edit, hapus villanya sendiri
CREATE POLICY "Owner can insert own villa" ON public.villas FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own villa" ON public.villas FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own villa" ON public.villas FOR DELETE USING (auth.uid() = owner_id);

-- 3. Policy untuk bookings
-- Owner bisa melihat seluruh pemesanan yang masuk ke villanya
CREATE POLICY "Owner can view bookings for their villas" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.villas WHERE villas.id = bookings.villa_id AND villas.owner_id = auth.uid())
);
-- Tamu (jika login) bisa melihat pemesanannya sendiri
CREATE POLICY "Guest can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = guest_id);
-- Publik bisa membuat booking
CREATE POLICY "Anyone can create booking" ON public.bookings FOR INSERT WITH CHECK (true);

-- 4. Policy untuk transactions
-- Owner bisa melihat transaksi yang terkait dengan villanya
CREATE POLICY "Owner can view transactions for their villas" ON public.transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings
        JOIN public.villas ON villas.id = bookings.villa_id
        WHERE bookings.id = transactions.booking_id AND villas.owner_id = auth.uid()
    )
);

-- ==========================================
-- TRIGGERS UNTUK SUPABASE AUTH
-- ==========================================
-- Fungsi ini akan otomatis menyalin user baru dari `auth.users` (saat Register via Google/Email) ke `public.user_profiles`

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
