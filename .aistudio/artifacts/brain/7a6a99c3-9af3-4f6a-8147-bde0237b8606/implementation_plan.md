# Rencana Implementasi: Optimasi Egress Supabase & Penyelarasan Presisi gas-backend.js

Dokumen ini memuat rencana kerja untuk mengatasi kelebihan kuota Egress Supabase (Opsi 1) dengan tetap menjaga keselarasan penuh antara sistem Supabase dan ekosistem Google (Spreadsheet & Drive).

---

## 1. Analisis Masalah Egress
- **Penyebab Utama:**
  1. Adanya string Base64 gambar (1–3 MB per baris) yang tersimpan di kolom database (`tracking.foto_selesai`, `realisasi.foto_realisasi`, dan `work_orders.foto`).
  2. Query pembacaan data massal (`select('*')`) menarik seluruh 2.686+ baris sekaligus setiap 30 detik (karena durasi cache sangat singkat dan sering di-clear).
- **Target Hasil:**
  - Penurunan penggunaan bandwidth/egress Supabase sebesar **90–95%**.
  - Aplikasi berjalan cepat, lancar, dan akun Supabase bebas dari risiko penangguhan/pembatasan kuota.

---

## 2. Rencana Perubahan & Langkah Kerja

### Tahap 1: Pembersihan Data Base64 Lama di Supabase
1. Menjalankan skrip pembersihan langsung ke Supabase:
   - Mendeteksi record pada tabel `work_orders`, `tracking`, dan `realisasi` yang berisi `data:image/...`.
   - Mengganti nilai Base64 tersebut dengan link thumbnail Drive yang valid atau membersihkannya menjadi URL ringkas.
2. Memastikan ukuran total database dan transfer per query menyusut dari puluhan megabyte menjadi hanya beberapa kilobyte.

### Tahap 2: Standardisasi Penyimpanan Foto 100% Google Drive URL
1. **Di `server/supabaseBackend.ts`:**
   - Untuk setiap alur yang mengunggah foto (`submitWorkOrder`, `submitReviewForm`, `updateTrackingStep`, `selesaikanPekerjaan`):
     - Jika foto dikirim dalam format Base64, foto terlebih dahulu diunggah ke Google Drive melalui Google Apps Script Web App.
     - Dapatkan link URL Drive (`https://lh3.googleusercontent.com/d/...`).
     - Simpan **HANYA link URL tersebut** ke kolom tabel Supabase. Tidak boleh lagi ada string Base64 yang masuk ke Supabase.
2. **Di `gas-backend.js`:**
   - Memastikan helper `uploadBase64ToDrive` mengembalikan URL Drive publik yang konsisten untuk seluruh kategori folder (WO, Area, Konstruksi, Hazard, Pelaksanaan, Realisasi).

### Tahap 3: Implementasi Smart Cache 10 Menit dengan Auto-Sync Mutasi
1. Mengubah `CACHE_TTL` di `server/supabaseBackend.ts` dari `30000` (30 detik) menjadi `600000` (10 menit).
2. Menerapkan **Selective In-Memory Cache Updating**:
   - Saat user membuat Work Order baru, sistem langsung menyisipkan data baru tersebut ke cache memori lokal di posisi teratas.
   - Saat user menyelesaikan pekerjaan atau mereview WO, sistem memperbarui record terkait di cache memori.
   - Dengan cara ini, pengguna langsung melihat data terbaru secara real-time tanpa server harus melakukan query ulang 2.686+ baris ke Supabase.

### Tahap 4: Optimasi Query Database (Column Pruning)
1. Pada query baca utama (`getWorkOrders`, `getReviewedWOs`, `getWorkPlans`, `getTracking`, `getRealisasiList`):
   - Hindari `select('*')` yang tidak terarah; gunakan seleksi kolom-kolom data yang benar-benar ditampilkan oleh antarmuka.
2. Mengurangi beban transfer data jaringan per panggilan API secara signifikan.

### Tahap 5: Penyelarasan Presisi `gas-backend.js` & Ekosistem Google
1. Memastikan seluruh data yang disimpan ke Supabase terdistribusi sinkron ke Google Spreadsheet:
   - **WorkOrders**: Kategori, NO.WO lanjutan dari angka tertinggi, proteksi kolom status & approval.
   - **Form Review WO**: Update tab APPROVAL ke sheet `APPROVAL REVIEW`, update tab bukti ke masing-masing sheet bukti, dan simpan hanya `NO. WO` pada baris kosong sheet `WORK PLAN` dan `TRACKING`.
   - **Selesaikan Pekerjaan**: Simpan hanya `NO. WO` di `LIST REALISASI`, dan tanggal realisasi format `DD/MM/YYYY` pada sheet `WORK PLAN`.
2. Menyinkronkan fungsi `gas-backend.js` dengan helper di `supabaseBackend.ts` sehingga tidak ada rumus spreadsheet yang terhapus atau tertimpa.

---

## 3. Rencana Pengujian & Verifikasi
1. **Uji Pembersihan Base64:** Memverifikasi bahwa jumlah record dengan string Base64 di Supabase menjadi 0.
2. **Uji Pengurangan Bandwidth:** Mengukur ukuran payload query sebelum dan sesudah optimasi.
3. **Uji Alur Kerja Lengkap:**
   - Submit Work Order Baru -> Pastikan tersimpan di Supabase & Spreadsheet, foto berupa link Drive.
   - Review WO -> Pastikan approval masuk ke APPROVAL REVIEW dan NO.WO tersimpan di WORK PLAN & TRACKING.
   - Selesaikan Pekerjaan -> Pastikan NO.WO masuk ke LIST REALISASI dan tanggal DD/MM/YYYY masuk ke WORK PLAN.
4. **Verifikasi Build:** Menjalankan `compile_applet` dan `lint_applet` untuk memastikan kode bebas kesalahan kompilasi.
