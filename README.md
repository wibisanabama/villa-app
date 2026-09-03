# Vilara

Vilara adalah aplikasi pemesanan dan pengelolaan villa untuk tamu, pemilik, staf, dan super-admin.

## Status

Proyek sedang dalam tahap MVP dan belum siap digunakan di production. Build dan pengujian lokal tersedia, tetapi integrasi Supabase, Google OAuth, Mayar sandbox, serta deployment staging masih harus diverifikasi menggunakan kredensial dan layanan nyata.

## Arsitektur

| Komponen | Teknologi |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| REST API | Express 5, TypeScript |
| Auth, database, storage | Supabase |
| Pembayaran | Mayar |
| Validasi dan kontrak | Zod |
| Unit dan API test | Vitest, Supertest |
| End-to-end test | Playwright |
| Package manager | pnpm workspace |

## Struktur Repository

```text
frontend/  Next.js, komponen UI, dan pengujian E2E
backend/   Express API, kontrak bersama, migration, seed, dan pengujian API
```

Perintah workspace dan dokumentasi tetap berada di root repository.

## Prasyarat

- Node.js 20
- pnpm 10
- Supabase project
- Google OAuth credentials
- Mayar sandbox credentials

## Instalasi

```bash
pnpm install
```

Salin dan isi file environment:

```text
frontend/.env.example -> frontend/.env.local
backend/.env.example  -> backend/.env
```

Jangan memasukkan `SUPABASE_SERVICE_ROLE_KEY` atau `MAYAR_API_KEY` ke environment frontend.

## Database

Migration berada di `backend/supabase/migrations` dan data awal berada di `backend/supabase/seed.sql`.

Sebelum menerapkan migration pada project yang sudah berisi data:

1. Verifikasi Supabase project ID.
2. Buat backup database dan storage.
3. Terapkan migration pada staging.
4. Jalankan seed.
5. Verifikasi constraint booking, RLS, bucket storage, dan paket subscription.

Migration awal dapat mengubah struktur database lama. Jangan menjalankannya pada production tanpa backup yang telah diuji.

## Menjalankan Aplikasi

Jalankan API:

```bash
pnpm dev:api
```

Jalankan frontend pada terminal terpisah:

```bash
pnpm dev
```

Frontend tersedia di `http://localhost:3000`. API tersedia di `http://localhost:5000/api/v1`.

## Verifikasi

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:all
pnpm test:e2e
```

`pnpm test:e2e` saat ini hanya memverifikasi katalog publik pada viewport desktop dan mobile. Alur autentikasi, pembayaran, owner, staf, cancellation, dan admin masih memerlukan cakupan E2E tambahan.

## Mayar

Webhook Mayar harus diarahkan ke:

```text
POST /api/v1/payments/webhooks/mayar
```

Gunakan environment sandbox sampai checkout, verifikasi webhook, rekonsiliasi invoice, payment review, dan refund tracking telah lulus smoke test.

## Deployment

- Frontend: Vercel menggunakan root directory `frontend` dan konfigurasi `frontend/vercel.json`.
- API: Railway menggunakan konfigurasi `backend/railway.json`.
- Maintenance job: jalankan `pnpm --filter @vilara/api job:maintenance` setiap lima menit.
- `FRONTEND_URL` dan `ALLOWED_ORIGINS` harus berisi domain frontend yang sebenarnya.

Deployment dianggap berhasil hanya setelah migration staging, Google OAuth, Mayar sandbox, webhook, dan seluruh smoke test selesai tanpa error.

## Dokumentasi Implementasi

Rencana, acceptance criteria, dan pekerjaan yang belum diverifikasi dicatat di `implementation_plan.md`.
