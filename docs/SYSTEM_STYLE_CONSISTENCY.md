# 🎨 Master Prompt: System Style Consistency (SINTAK 2026)

Gunakan prompt ini untuk menyelaraskan tampilan (style) di seluruh sistem SINTAK agar konsisten, premium, dan tajam (crisp).

---

## 🛠️ Master Prompt Penyelarasan Style

**Salin teks di bawah ini jika Anda ingin menyelaraskan style modul tertentu atau seluruh sistem:**

> **Tugas: Standarisasi Visual & Konsistensi UI (SINTAK 2026 Standard)**
>
> Saya ingin Anda memeriksa dan menyelaraskan modul **[Sebutkan Nama Modul/Semua]** agar mengikuti standar visual premium SINTAK terbaru.
>
> **PANDUAN VISUAL SINTAK:**
>
> **1. Tabel & Data Grid (Pixel Perfect):**
> - **Structure:** Gunakan `border-separate border-spacing-0` (WAJIB: Jangan gunakan `border-collapse`).
> - **Borders & Cells:**
>   - Background `bg-white`.
>   - Border bawah (`border-b`) dan samping (`border-r`) harus ada di SEMUA elemen **`th`** DAN **`td`** secara individual.
>   - Warna: `border-gray-200`.
> - **Data Formatting (Accounting Style):**
>   - **Casing:** JANGAN paksa `uppercase` atau `lowercase` pada data isi tabel (Biarkan sesuai data asli Digit).
>   - **Angka (Tabular):** Wajib menggunakan class `tabular-nums` agar digit lurus vertikal sempurna.
>   - **Mata Uang (Rp):** Gunakan layout `flex justify-between items-baseline gap-2 overflow-hidden`. Simbol `Rp` (shrink-0) di kiri, angka (truncate/ellipsis) di kanan.
>   - **Jumlah Desimal:** WAJIB 2 angka di belakang koma (`.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`).
>
> **2. Container & Card:**
> - Gunakan `border border-gray-200 shadow-sm rounded-[10px]` untuk pembungkus utama data.
> - Pastikan `overflow-hidden` aktif agar sudut bulat tidak terpotong konten di dalamnya.
> - Layout antar card/section harus memiliki `gap-5`.
>
> **3. Input & Search Bar:**
> - Border: `border-gray-200`.
> - Focus State: `focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all`.
> - Radius: `rounded-[14px]`.
> - Font: `font-semibold text-[13px]`.
>
> **4. Footer & Pagination Area:**
> - Gunakan `mt-3 px-1` sebagai standar jarak di bawah tabel.
> - Warna teks keterangan: `text-gray-700 font-bold`.
> - Typography: Sentence case (Jangan uppercase untuk teks naratif).
>
> **Tujuan Akhir:**
> User tidak boleh merasakan perbedaan posisi atau gaya visual saat berpindah-pindah tab menu. UI harus terasa statis, solid, dan tidak "melompat".

---

## 📋 Audit Checklist untuk AI
- [ ] Apakah tabel sudah menggunakan `border-separate`?
- [ ] Apakah `th` dan `td` sudah memiliki `border-b`?
- [ ] Apakah angka sudah memiliki 2 desimal?
- [ ] Apakah angka menggunakan `tabular-nums`?
- [ ] Apakah `Rp` dipisah menggunakan `flex justify-between` di dalam sel?
- [ ] Apakah ada `truncate` pada angka di dalam flex container?
- [ ] Apakah footer sudah memiliki `mt-3` dan `px-1`?

---
*Gunakan ini sebagai "Source of Truth" untuk urusan tampilan di SINTAK.*
