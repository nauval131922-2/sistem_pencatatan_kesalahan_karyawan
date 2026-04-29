# AI Session Summary - 2026-04-29 (Sesi Sore)

## 📅 Detail Sesi
- **Tanggal**: 2026-04-29
- **Waktu**: 14:00 - 15:15 WIB
- **PC**: Lokal (Kantor)

## 🚀 Fitur & Perbaikan
1. **Optimasi Tracking Manufaktur Dua Jalur**: Implementasi filter ganda (Pilih BOM & Pilih Nama Barang) dengan lebar 50/50. Menghapus tombol reset manual untuk UI yang lebih minimalis.
2. **Backward Tracing Engine**: Mengembangkan logika pelacakan mundur di API jika pencarian dimulai dari Rekap Pembelian (Faktur PB). Alur: `Rekap -> PO -> SPH In -> SPPH -> PR -> Order Produksi -> BOM`.
3. **Deep Linking Bahan Baku (BBB)**: Menambahkan kemampuan pencarian pemakaian material spesifik dengan membedah JSON `raw_data` (field `hp_detil`) di tabel `bahan_baku` menggunakan filter Faktur PB.
4. **Dynamic Column & Labeling**: 
   - Menyembunyikan kolom produksi secara otomatis jika sumber pelacakan adalah Rekap Barang.
   - Implementasi label dinamis pada kolom PO dan BBB Produksi yang berubah teksnya sesuai jalur pelacakan (BOM vs Rekap).
5. **Aesthetics & Readability**: Menerapkan kebijakan *Sentence Case* (menghapus kapital semua) pada seluruh label keterangan logika di tabel tracking.
6. **Bug Fix TypeScript**: Memperbaiki error kompilasi "implicit any" pada variabel `conditions` dan `args` di API route tracking.

## ⚙️ Keputusan Teknis Penting
- **Mutual Exclusion Filters**: Memutuskan untuk mengosongkan state filter lawan saat salah satu filter dipilih untuk mencegah kebingungan data di satu tampilan tabel.
- **JSON String Matching**: Menggunakan `LIKE %targetFaktur%` pada kolom `raw_data` untuk menghubungkan Rekap PB ke pemakaian bahan baku tanpa merombak skema database yang sudah ada.
- **User-Centric Dynamic Labeling**: Memberikan informasi relasi database yang berbeda (`via SPH In` vs `via Rekap`) agar user memahami asal-usul data berdasarkan cara mereka mencari.

## 📌 Status Task & Hal yang Perlu Dilanjutkan
- ✅ Fitur pelacakan dua jalur selesai dan stabil.
- 🔄 Lakukan verifikasi data untuk Faktur PB yang sangat lama (historical data) guna memastikan konsistensi JSON `hp_detil`.
- 📌 Evaluasi performa pencarian `LIKE` pada `raw_data` jika volume data `bahan_baku` meningkat drastis di masa depan.

## 📂 Dokumentasi Baru/Diperbarui
- New `docs/tutorials/07-optimasi-pencarian-tracking-dua-jalur.md`
- Update `docs/BUILD_FROM_SCRATCH.md`
- Update `docs/task.md`
