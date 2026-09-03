# Vilara

Aplikasi pemesanan dan pengelolaan villa untuk tamu, pemilik, staf, dan super-admin.

## Status

MVP dalam pengembangan. Build lokal tersedia. Supabase, Google OAuth, Mayar sandbox, dan deployment staging belum diverifikasi menggunakan layanan production-like.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Express 5, TypeScript |
| Auth, database, storage | Supabase |
| Pembayaran | Mayar |
| Validasi | Zod |
| Pengujian | Vitest, Supertest, Playwright |
| Package manager | pnpm |

## Struktur

```text
frontend/  Aplikasi Next.js dan pengujian E2E
backend/   REST API, contracts, migration, seed, dan pengujian API
```

Frontend dan backend memiliki dependency serta lockfile terpisah.

## Prasyarat

- Node.js 20
- pnpm 10
- Supabase project
- Google OAuth credentials
- Mayar sandbox credentials

## Instalasi

```bash
pnpm --dir frontend install
pnpm --dir backend install
```

Siapkan environment:

```text
frontend/.env.example -> frontend/.env.local
backend/.env.example  -> backend/.env
```

Jangan menempatkan service-role key atau Mayar API key di frontend.

## Menjalankan Lokal

Terminal pertama:

```bash
pnpm --dir backend dev
```

Terminal kedua:

```bash
pnpm --dir frontend dev
```

| Layanan | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API | `http://localhost:5000/api/v1` |

## Database

- Migration: `backend/supabase/migrations`
- Seed: `backend/supabase/seed.sql`
- SQL tests: `backend/supabase/tests`

Verifikasi Supabase project ID dan buat backup sebelum menjalankan migration pada database yang sudah berisi data.

## Verifikasi

Frontend:

```bash
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend build
pnpm --dir frontend test:e2e
```

Backend:

```bash
pnpm --dir backend typecheck
pnpm --dir backend test
pnpm --dir backend exec tsc -p contracts/tsconfig.json --noEmit
pnpm --dir backend build
```

Pengujian E2E saat ini hanya mencakup katalog publik pada viewport desktop dan mobile.

## Deployment

| Layanan | Root directory | Konfigurasi |
| --- | --- | --- |
| Vercel | `frontend` | `frontend/vercel.json` |
| Railway | `backend` | `backend/railway.json` |

Webhook Mayar:

```text
POST /api/v1/payments/webhooks/mayar
```

Jalankan maintenance job setiap lima menit:

```bash
pnpm --dir backend job:maintenance
```
