# MySavings — Personal Finance & Savings Management

Aplikasi web React untuk mencatat pemasukan/pengeluaran, mengatur target tabungan, melihat laporan, dan menyimpan data secara lokal di browser.

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

Untuk membuat build produksi, jalankan `npm run build`. Data aplikasi tersimpan di LocalStorage browser. Gunakan menu **Pengaturan → Unduh backup** untuk membuat cadangan JSON.

## Struktur

- `src/components/` — komponen layout dan modal.
- `src/data/` — data contoh.
- `src/hooks/` — state serta persistensi LocalStorage.
- `src/pages/` — halaman dashboard, target, transaksi, laporan, kalender, kategori, dan pengaturan.
- `src/utils/` — perhitungan dan format mata uang/tanggal.
- `src/styles.css` — tema dan layout responsif.

Laporan dapat diunduh sebagai workbook Excel `.xlsx` dan PDF. Pengaturan profil, saldo awal, tema, notifikasi, serta foto profil tersimpan di LocalStorage; item notifikasi dapat dibuka dan ditandai dibaca.
