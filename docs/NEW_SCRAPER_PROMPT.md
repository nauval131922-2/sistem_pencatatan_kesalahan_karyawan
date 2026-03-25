# 🚀 Blueprint: Pembuatan Scraper Baru (SINTAK 2026 Standard)

Gunakan blueprint ini sebagai instruksi ke AI untuk membuat halaman scrapper baru yang **100% konsisten** dengan module yang sudah ada (Sales Order, Sales Report, dll).

---

## 🛠️ Prompt Master Scraper

**Copy-paste instruksi ini ke chat baru:**

> **Tugas: Buat Halaman Scrapper untuk [Nama Modul]**
>
> Saya ingin Anda membuat halaman scrapper baru menggunakan Next.js (App Router) dan TypeScript. Halaman ini harus identik secara visual dan fungsional dengan modul scrapper SINTAK lainnya.
>
> **PERSYARATAN TEKNIS:**
> 1. **Framework:** React Server Components (Page) dan Client Components (Client Page).
> 2. **State Management:** Gunakan standard `useState`, `useMemo`, `useEffect`, dan `useRef` untuk handling data besar (pagination 50 data).
> 3. **Fitur Wajib:**
>    - **Search Bar:** Real-time search dengan debouncing.
>    - **DatePicker:** Pencarian range tanggal (Identik dengan `DatePicker` component).
>    - **Resizable Columns:** Kolom tabel yang bisa ditarik lebarnya (z-index header 20).
>    - **Multi-select Rows:** Klik baris untuk pilih, Shift+Click untuk range selection.
>    - **Batch Process:** Tombol aksi di bagian atas untuk process data yang dipilih.
>
> **STANDAR VISUAL (SINTAK 2026):**
> - **Table Structure:** Gunakan `border-separate border-spacing-0` (WAJIB: Jangan gunakan border-collapse).
> - **Borders:** Warna `border-gray-200`. Garis bawah (`border-b`) harus ada di setiap elemen `th` dan `td`.
> - **Data Formatting (Accounting Style):**
>   - **Teks:** JANGAN gunakan class `uppercase` atau `lowercase` pada data isi tabel (Biarkan sesuai data asli Digit).
>   - **Angka (QTY/Harga/Jumlah):**
>     - Wajib menggunakan class `tabular-nums` agar digit lurus vertikal.
>     - Wajib sertakan 2 angka di belakang koma (`.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`).
>     - **Mata Uang (Rp):** Gunakan layout `flex justify-between items-baseline gap-2 overflow-hidden`. Posisikan simbol `Rp` (shrink-0) di kiri dan angka (truncate) di kanan agar koma desimal sejajar.
> - **Typography:** Data menggunakan `text-gray-700` (bold untuk ID/Nama). Header menggunakan `text-[#6b7280]` font-bold (size 11px).
> - **Footer:** Standar `mt-3 px-1` dengan keterangan "Menampilkan X dari Y data" dan indikator kecepatan `⚡`.
>
> **UI COMPONENTS:**
> - Gunakan `Search`, `Calendar`, `Hash`, `Package`, `User` icons dari `lucide-react`.
> - Gunakan desain "Premium Card" (background putih, border abu tipis, shadow lembut).
