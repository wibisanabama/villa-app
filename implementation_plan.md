# Rancangan Sistem SaaS Villa (Villa Management Software)

SaaS ini dirancang untuk membantu pemilik dan pengelola villa dalam mengelola properti, pemesanan, harga, dan operasional sehari-hari dari satu platform terpusat.

## 1. Fitur Utama (Features)

### A. Untuk Pemilik/Pengelola Villa (Tenant Dashboard)
1. **Manajemen Properti**: Tambah, edit, hapus data properti villa (nama, deskripsi, fasilitas, galeri foto, lokasi).
2. **Manajemen Pemesanan (Booking)**: Kalender ketersediaan, daftar reservasi, konfirmasi/batal pesanan, integrasi kalender pihak ketiga (iCal).
3. **Manajemen Harga (Pricing)**: Pengaturan harga per malam, harga musiman (high/low season), dan diskon khusus.
4. **Keuangan & Laporan (Reporting)**: Dashboard analitik (pendapatan, tingkat okupansi), riwayat transaksi, dan ekspor laporan.
5. **Manajemen Tamu (CRM)**: Database profil tamu, riwayat kunjungan tamu.
6. **Manajemen Staf**: Penambahan akun staf dengan role berbeda (Owner, Resepsionis, Housekeeping).

### B. Untuk Tamu (Guest Booking Engine)
1. **Halaman Pemesanan**: Halaman publik (bisa berupa sub-domain atau widget) bagi tamu untuk melihat ketersediaan dan melakukan pemesanan langsung (Direct Booking).
2. **Integrasi Pembayaran**: Checkout dengan metode pembayaran online (Payment Gateway menggunakan Mayar.id).

### C. Untuk Super Admin (Pemilik SaaS)
1. **Manajemen Pengguna SaaS**: Melihat dan mengelola akun pengelola villa yang berlangganan.
2. **Manajemen Paket Langganan**: Membuat paket langganan SaaS (contoh: Basic, Pro, Enterprise).

## 2. Arsitektur Sistem

- **Pola Arsitektur**: Client-Server (Frontend & Backend terpisah) menggunakan arsitektur RESTful API.
- **Frontend (Antigravity Gemini)**:
  - **Framework**: React (Vite) atau Next.js.
  - **Styling**: Vanilla CSS (Sesuai dengan standar estetika desain premium Antigravity yang menggunakan animasi dinamis, palet warna elegan, tanpa framework CSS seperti Tailwind kecuali diminta khusus).
  - **State Management**: Zustand atau React Context.
- **Backend (Gemini CLI)**:
  - **Framework**: Node.js (Express/NestJS) atau PHP (Laravel) - bebas dipilih sesuai bahasa yang paling dikuasai.
  - **Database**: Supabase (PostgreSQL).
  - **Autentikasi**: Supabase Auth terintegrasi dengan OAuth Google Login.
- **Infrastruktur Tambahan**:
  - **Payment Gateway**: Mayar.id.
  - **Cloud Storage**: Supabase Storage (disarankan karena memakai Supabase DB).

---

## Keputusan Tech Stack (Approved)

> [!NOTE]
> Berdasarkan keputusan, berikut adalah teknologi yang akan digunakan:
> 1. **Tech Stack Backend**: Node.js.
> 2. **Tech Stack Frontend**: Next.js.
> 3. **Desain UI/UX**: Terang minimalis (Light Minimalist).

---

## 3. Pembagian Tugas (To-Do List)

> [!IMPORTANT]
> **Aturan Wajib Agen (Agent Rules):**
> Setiap kali **satu fitur/tugas** selesai dikerjakan, Anda **WAJIB**:
> 1. Melakukan `git commit` dan `git push` ke repository.
> 2. Mencentang (memberi tanda `[x]`) pada tugas yang sudah dikerjakan di file `implementation_plan.md` ini.

Berikut adalah panduan daftar tugas yang memisahkan ranah Frontend dan Backend. File ini bisa dibaca oleh agen Gemini CLI untuk menyelesaikan bagiannya.

### Backend Tasks (Untuk Gemini CLI)
- [x] **Setup Project Backend**: Inisialisasi project, setup koneksi Supabase, konfigurasi CORS, dan environment variables.
- [x] **Desain Skema Database (SaaS Multi-tenant di Supabase)**:
  - Table `users` (Pemilik Villa, Staf, Super Admin) terintegrasi dengan Supabase Auth.
  - Table `villas` (Data properti yang bereferensi ke owner) plus konfigurasi Row Level Security (RLS).
  - Table `bookings` (Data reservasi tamu).
  - Table `transactions` (Pembayaran).
  - Table `subscriptions` (Paket berlangganan SaaS).
- [x] **Modul Autentikasi & Otorisasi**:
  - Setup OAuth Google Login via Supabase Auth.
  - Konfigurasi Role & Permission berbasis JWT dari Supabase atau RLS.
- [x] **API Manajemen Properti (Villas)**: CRUD data properti dan fungsionalitas upload foto.
- [x] **API Pemesanan (Bookings)**: Algoritma untuk mengecek ketersediaan tanggal (*overlapping dates*), membuat booking baru, dan merubah status.
- [ ] **API Dashboard/Analitik**: Endpoint khusus untuk menghitung total pendapatan, tingkat okupansi, dan data metrik untuk chart bulanan.
- [ ] **Integrasi Payment Gateway (Mayar.id)** *(Tahap Lanjut)*: API untuk generate link pembayaran dan webhook endpoint untuk update status pesanan.

### Frontend Tasks (Untuk Antigravity - Saya)
- [ ] **Setup Project Frontend**: Inisialisasi Vite + React atau Next.js, sistem routing, dan struktur folder yang modular.
- [ ] **Desain UI Foundation (Design System)**:
  - Penentuan palet warna premium (contoh: dark mode sleek atau light mode elegan dengan HSL).
  - Pengaturan typography (Google Fonts) dan utility classes CSS.
  - Pembuatan komponen reusable: Button, Custom Input, Modal, Dropdown interaktif, Table, Card.
- [ ] **Pembuatan Halaman Autentikasi**:
  - Desain antarmuka Login dan Register SaaS yang memukau secara visual.
- [ ] **Pembuatan Layout Utama (Tenant Dashboard)**:
  - Sidebar navigasi yang mulus, Topbar, dan container utama responsif.
- [ ] **Halaman Dashboard Overview**:
  - Implementasi UI ringkasan analitik (Stat Cards) dan visualisasi chart yang memiliki micro-animations.
- [ ] **Halaman Manajemen Villa**:
  - Tabel daftar properti, form tambah/edit villa (UI yang intuitif), dan grid galeri foto.
- [ ] **Halaman Kalender Pemesanan**:
  - Tampilan daftar booking (List View) dan interaktif kalender (Calendar View).
- [ ] **Integrasi API Frontend**: 
  - Menyambungkan UI dengan endpoint backend menggunakan Fetch API / Axios.
  - Handling loading state, error, dan notifikasi (Toast/Alert) secara mulus.
