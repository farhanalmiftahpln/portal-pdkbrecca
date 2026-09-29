# Panduan Deployment ke Vercel (Tahap 4)

Dokumen ini berisi panduan lengkap untuk men-deploy aplikasi **K3 PLN Icon Plus (SIM-K3 / SIAP-K3)** ke platform **Vercel** menggunakan repositori Git (GitHub / GitLab / Bitbucket).

---

## 1. Prasyarat

Sebelum memulai, pastikan Anda telah memiliki:
1. Akun **[GitHub](https://github.com)** (atau GitLab / Bitbucket).
2. Akun **[Vercel](https://vercel.com)** (dapat login langsung menggunakan akun GitHub).
3. Akses kredensial **Supabase** (URL, Anon Key, Service Role Key).
4. URL Web App **Google Apps Script (GAS)** yang masih aktif.

---

## 2. Struktur Konfigurasi Vercel yang Disediakan

Aplikasi ini sudah dilengkapi dengan konfigurasi otomatis:
- **`vercel.json`**: Mengatur routing otomatis untuk Vercel:
  - Route `/api/:match*` diarahkan ke Serverless Function Express (`api/index`).
  - Route SPA `/:match*` diarahkan ke `index.html` (mencegah error 404 saat refresh halaman seperti `/work-order`, `/work-plan`, `/realisasi`, dll.).
  - Output directory build disetel ke `dist`.
- **`api/index.js`**: Entry point Vercel Serverless Function mandiri yang dibundel secara otomatis dari `server/vercelHandler.ts` via `esbuild`. Seluruh kode backend Express, Supabase client, dan GAS proxy sudah menyatu di dalamnya sehingga tidak membutuhkan ketergantungan folder eksternal di runtime Vercel.

---

## 3. Langkah 1: Push Repositori ke GitHub

Jika repositori belum ada di GitHub:

1. Buat repositori baru di GitHub (misalnya: `siap-k3-pln`).
2. Di terminal komputer lokal Anda, jalankan perintah berikut:

```bash
# Inisialisasi git jika belum
git init

# Tambahkan seluruh file proyek
git add .

# Buat commit pertama
git commit -m "feat: setup siap-k3-pln ready for vercel deployment"

# Ubah branch utama menjadi main
git branch -M main

# Hubungkan dengan remote repository GitHub Anda (ganti URL sesuai repo Anda)
git remote add origin https://github.com/USERNAME/siap-k3-pln.git

# Push ke GitHub
git push -u origin main
```

---

## 4. Langkah 2: Import Proyek di Dashboard Vercel

1. Buka dashboard Vercel di [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Klik tombol **"Add New..."** di kanan atas, lalu pilih **"Project"**.
3. Di bagian **"Import Git Repository"**, cari dan pilih repositori `siap-k3-pln` yang telah Anda push.
4. Klik tombol **"Import"**.

---

## 5. Langkah 3: Konfigurasi Build & Output Settings

Pada halaman konfigurasi proyek Vercel:

| Pengaturan | Nilai / Konfigurasi | Keterangan |
| :--- | :--- | :--- |
| **Project Name** | `siap-k3-pln` (atau sesuai keinginan) | Nama proyek di Vercel |
| **Framework Preset** | **Vite** | Terdeteksi otomatis oleh Vercel |
| **Root Directory** | `./` | Biarkan default (root) |
| **Build Command** | `npm run build` | Otomatis dari `package.json` |
| **Output Directory** | `dist` | Otomatis dari `vercel.json` |
| **Install Command** | `npm install` | Default |

---

## 6. Langkah 4: Pengaturan Environment Variables di Vercel

Di halaman import yang sama, buka bagian **"Environment Variables"** (atau dapat diatur nanti di *Project Settings -> Environment Variables*).

Tambahkan variabel-variabel berikut (pastikan dicentang untuk lingkungan **Production**, **Preview**, dan **Development**):

| Nama Variabel (Key) | Nilai (Value) | Keterangan |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://iswgycclurbdxrnrxbvz.supabase.co` | URL Project Supabase Anda |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public Anon Key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Service Role Key (wajib untuk operasi backend/sync) |
| `VITE_GAS_WEB_APP_URL` | `https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec` | URL Deployment Web App Google Apps Script |
| `GEMINI_API_KEY` | *(Opsional)* API Key Google Gemini AI | Diperlukan jika menggunakan fitur asisten AI |

> 💡 **Penjelasan Peringatan Vercel *"Keep This Value Private"***:
> - Saat Anda memasukkan variabel dengan awalan `VITE_` (seperti `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GAS_WEB_APP_URL`), Vercel akan memunculkan dialog peringatan: *"The VITE_ prefix exposes this value to the browser. Remove the prefix, or change the variable to Config if it's safe to expose."*
> - **Tindakan**: Ini adalah peringatan wajar dari Vercel. Kredensial berawalan `VITE_` memang didesain publik untuk frontend browser. Anda cukup memilih opsi **"Config / Plain text"** atau klik **Save / Lanjutkan**.
> - **Variabel Rahasia**: Pastikan variabel `SUPABASE_SERVICE_ROLE_KEY` (dan `GEMINI_API_KEY`) **TIDAK** menggunakan awalan `VITE_` dan disimpan dengan tipe **Secret / Sensitive** agar tetap aman di sisi server.

> ⚠️ **Catatan Penting Setelah Menambah Environment Variable**:
> Jika Anda menambahkan atau mengubah Environment Variable setelah deployment pertama sudah berjalan, variabel baru **belum langsung aktif**. Anda **WAJIB melakukan Redeploy**:
> 1. Buka tab **Deployments** di project Vercel Anda.
> 2. Klik ikon tiga titik (`...`) di samping deployment terbaru.
> 3. Pilih **Redeploy** (centang *Use existing Build Cache* atau *Redeploy without cache*).
> 4. Tunggu deployment selesai, lalu coba login kembali.

---

## 7. Langkah 5: Deploy dan Verifikasi

1. Klik tombol **"Deploy"** di bagian bawah halaman Vercel.
2. Tunggu proses build selesai (biasanya memakan waktu 1–2 menit).
3. Setelah status berubah menjadi **"Congratulations! What's next?"**, klik tautan preview/domain yang diberikan oleh Vercel (misal: `https://siap-k3-pln.vercel.app`).
4. **Verifikasi Fitur**:
   - Cek apakah halaman Login dapat dibuka dengan normal.
   - Cek navigasi ke Dashboard, Work Order, Work Plan, Realisasi, Personil, dan Warehouse.
   - Coba tombol **"Sinkron Spreadsheet"** pada halaman Work Order, Work Plan, atau Realisasi untuk memastikan komunikasi Serverless Function dengan Supabase & Google Apps Script berjalan lancar.
   - Uji endpoint status kesehatan di browser: `https://siap-k3-pln.vercel.app/api/health` (harus menghasilkan `{"status":"ok", ...}`).

---

## 8. Langkah 6: Menghubungkan Custom Domain (Opsional)

Jika Anda ingin menggunakan domain instansi/kustom:
1. Di dashboard Vercel proyek Anda, buka menu **Settings** > **Domains**.
2. Masukkan nama domain yang diinginkan (misal: `k3.iconplus.co.id` atau `siapk3-pln.id`).
3. Ikuti panduan penambahan DNS Record (A Record / CNAME Record) yang disediakan oleh Vercel pada panel DNS penyedia domain Anda.
4. Sertifikat SSL (HTTPS) akan diterbitkan secara otomatis dan gratis oleh Vercel.

---

## 9. Pemecahan Masalah (Troubleshooting)

### Error 404 saat Refresh Halaman Tertentu
- **Penyebab**: Web server mencoba mencari file HTML fisik sesuai path URL.
- **Solusi**: Sudah diatasi secara otomatis oleh aturan `rewrites` di `vercel.json` yang mengarahkan seluruh rute SPA non-API ke `/index.html`.

### Sinkronisasi Spreadsheet / Operasi Database Gagal di Vercel
- **Penyebab**: Variabel lingkungan `SUPABASE_SERVICE_ROLE_KEY` atau `VITE_GAS_WEB_APP_URL` belum diisi di menu *Settings > Environment Variables* Vercel.
- **Solusi**: Pastikan variabel tersebut telah ditambahkan, lalu lakukan **Redeploy** (Deployments > klik titik tiga pada deployment terbaru > *Redeploy*).

### Payload Too Large saat Upload Foto/Dokumen Besar
- **Penyebab**: Batasan ukuran body serverless function.
- **Solusi**: `server/app.ts` telah dikonfigurasi dengan limit `50mb` (`express.json({ limit: '50mb' })`).
