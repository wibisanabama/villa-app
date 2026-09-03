# Vilara

Marketplace dan ruang operasional villa untuk tamu, pemilik, staf, dan super-admin. Frontend menggunakan Next.js 16; REST API menggunakan Express TypeScript; autentikasi, PostgreSQL, dan storage menggunakan Supabase; pembayaran menggunakan Mayar.

## Menjalankan lokal

1. Salin `.env.example` ke `.env.local` dan `backend/.env.example` ke `backend/.env`.
2. Jalankan `pnpm install`.
3. Reset Supabase development lalu terapkan `supabase/migrations` dan `supabase/seed.sql`.
4. Jalankan API dengan `pnpm dev:api`, lalu frontend dengan `pnpm dev`.

Quality gate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build:all`.

## Database dan reset

Migration awal adalah destructive untuk database lama. Sebelum production:

1. Verifikasi Supabase project ID dan ambil backup database/storage.
2. Uji reset pada project staging.
3. Jalankan migration, lalu seed paket Starter, Professional, dan Enterprise.
4. Pastikan Google OAuth redirect memuat `/auth/callback` untuk domain staging/production.
5. Masukkan email admin awal ke `SUPER_ADMIN_EMAILS`.

Jangan memasukkan service-role key atau Mayar API key ke environment frontend.

## Mayar

- Gunakan akun sandbox terlebih dahulu dan arahkan webhook ke `POST /api/v1/payments/webhooks/mayar`.
- Invoice menyimpan referensi internal di `extraData`; webhook selalu diverifikasi ulang melalui detail invoice Mayar.
- Payment review dan refund manual ditangani dari panel admin/owner.
- Setelah smoke test sandbox lulus, ganti base URL dan API key di Railway tanpa mengubah frontend.

## Deployment

- Vercel: hubungkan root repository dan isi seluruh `NEXT_PUBLIC_*`.
- Railway: buat service dengan root directory `backend`, gunakan `backend/railway.json`, lalu isi environment dari contoh backend.
- Tambahkan Railway scheduled service yang menjalankan `pnpm --filter @vilara/api job:maintenance` setiap lima menit.
- `ALLOWED_ORIGINS` dan `FRONTEND_URL` harus memakai URL Vercel yang sebenarnya.

Rollback aplikasi dilakukan dengan redeploy commit sebelumnya. Migration database tidak diubah setelah diterapkan; buat migration kompensasi dan pulihkan backup hanya jika migration gagal secara material.

## Status MVP

Tersedia: katalog dan booking terautentikasi, hold 30 menit, pembayaran Mayar, profil/riwayat tamu, studio owner, kalender booking, staf per villa, paket 30 hari dengan grace period, serta admin minimum. Fitur di luar MVP dicatat di `implementation_plan.md`.
