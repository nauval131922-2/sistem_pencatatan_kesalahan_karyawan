# 13. Scraper Rek Akuntansi & Analisis Kas Jurnal Umum

Tutorial ini menjelaskan implementasi modul scraper Rek Akuntansi, standarisasi komponen UI untuk aksi scraping, serta peningkatan fitur analisis kas pada Jurnal Umum.

## 1. Implementasi Scraper Rek Akuntansi
Modul baru ini memungkinkan penarikan data rekening akuntansi langsung ke database lokal.

### Langkah Implementasi:
1. **API Route**: Membuat endpoint di `src/app/api/rek-akuntansi/route.ts` untuk mengambil data dan `src/app/api/scrape-rek-akuntansi/route.ts` untuk menjalankan scraper.
2. **Frontend UI**: Membuat `RekAkuntansiClient.tsx` dengan layout tabel premium dan integrasi tombol "Tarik Data".

## 2. Standarisasi Komponen `DateRangeCard`
Untuk memastikan konsistensi UI di seluruh modul scraper, tombol "Tarik Data" direfaktor menjadi komponen reusable.

### Perubahan Utama:
- Mengekstrak UI tombol gradient premium ke dalam `src/components/DateRangeCard.tsx`.
- Menggunakan ikon `DownloadCloud` dari Lucide React sebagai standar baru.
- Mendukung prop `onStartDateChange` dan `onEndDateChange` untuk fleksibilitas filter.

## 3. Fitur Analisis Kas pada Jurnal Umum
Peningkatan fungsionalitas untuk membantu pemantauan arus kas secara real-time.

### Fitur yang Ditambahkan:
- **Highlight Rekening Kas**: Baris yang berisi rekening tipe "Kas" (berdasarkan data `rek_akuntansi`) kini diberi warna latar belakang *violet* lembut.
- **Kolom Arus Kas**: Menambahkan kolom kumulatif baru yang menghitung `Debit - Kredit` khusus untuk akun Kas.
- **Saldo Awal Dinamis**: Sistem secara otomatis menghitung saldo awal kas berdasarkan filter tanggal yang dipilih.

## 4. Perbaikan Bug Paginasi (Infinite Scroll)
Memperbaiki masalah di mana data berhenti dimuat saat scrolling di tabel besar.

### Perbaikan:
- Mengganti perbandingan `data.length < totalCount` menjadi `page < totalPages`.
- Memastikan `page` di-reset ke `1` setiap kali filter tanggal atau pencarian berubah.

---
*Tutorial ini diperbarui secara otomatis pada akhir sesi.*
