# MySavings — Personal Finance & Savings Management

Aplikasi web React untuk mencatat pemasukan/pengeluaran, mengatur target tabungan, dan melihat laporan. Aplikasi dimulai tanpa data contoh dan tidak memerlukan login; data, profil, dan foto tersimpan lokal di browser/perangkat ini.

## Menjalankan aplikasi

1. Pastikan Node.js versi 18 atau lebih baru dan npm sudah terpasang.
2. Buka folder proyek ini di Visual Studio Code.
3. Jalankan terminal pada folder proyek, lalu instal dependency:

   ```bash
   npm install
   ```

4. Jalankan server development:

   ```bash
   npm run dev
   ```

5. Buka URL yang ditampilkan Vite di terminal (umumnya `http://localhost:5173`).

Data di LocalStorage hanya tersedia di browser tempat aplikasi digunakan. Nama, email, dan foto profil dapat diubah pada Pengaturan; foto disimpan lokal. Gunakan **Pengaturan → Unduh backup** untuk memindahkan data ke perangkat lain atau memulihkannya dari file cadangan.

Untuk menerbitkan ke Firebase Hosting, pasang Firebase CLI, pilih proyek dengan `firebase use --add`, lalu jalankan `npm run build` dan `firebase deploy`. Konfigurasi Hosting ada di `firebase.json`.

## Struktur

- `src/components/` — komponen layout dan modal.
- `src/data/` — struktur data awal kosong.
- `src/hooks/` — state serta persistensi LocalStorage.
- `src/pages/` — halaman dashboard, target, transaksi, laporan, kalender, kategori, dan pengaturan.
- `src/utils/` — perhitungan dan format mata uang/tanggal.
- `src/styles.css` — tema dan layout responsif.

Laporan dapat diunduh sebagai workbook Excel `.xlsx` dan PDF. Saldo awal, tema, notifikasi, dan data keuangan tersimpan di LocalStorage. Item notifikasi dapat dibuka dan ditandai dibaca. Saldo bank otomatis belum diaktifkan: integrasi Ayoconnect memerlukan akses sandbox/produksi, backend aman untuk kredensial penyedia, dan persetujuan pengguna; aplikasi tidak meminta password atau memindahkan uang.
