# Tutorial Standarisasi UI/UX SINTAK

Dokumen ini menjelaskan cara menjaga konsistensi desain yang telah diterapkan agar sistem tetap memiliki kesan premium dan rapi.

## 1. Menjaga Standar Border Kartu (1.5px)

Kita telah menerapkan standar border **1.5px** untuk memberikan efek yang lebih tegas. 

**Cara menerapkannya pada komponen baru:**
Jangan gunakan `border` standar Tailwind (`1px`), gunakan bracket value untuk ketebalan kustom:
```tsx
// SALAH (terlihat tipis/lemah)
<div className="border border-gray-100 rounded-[8px]">...</div>

// BENAR (terlihat premium & kokoh)
<div className="border-[1.5px] border-gray-200 rounded-[8px]">...</div>
```

**Warna Border yang disarankan:**
- Standard: `border-gray-200`
- Active/Focus: `border-green-500` atau `border-gray-300`

---

## 2. Implementasi Loading Overlay di DataTable

Jika Anda menambahkan fitur scraper baru yang menggunakan `DataTable.tsx`, pastikan prop `isLoading` dikirimkan dari parent.

**Logika di DataTable.tsx:**
Loading overlay sekarang bersifat **Absolute Floating**. Ini akan menutupi seluruh area tabel dan tetap berada di tengah layar meskipun tabelnya sangat lebar (horizontal scroll).

```tsx
<DataTable 
  data={myData}
  isLoading={isFetching} // Pastikan ini true saat data sedang diproses
  columns={myColumns}
/>
```

---

## 3. Konsistensi Header Sidebar

Setiap kali mengubah struktur sidebar, pastikan area **Header (Logo)** dan area **Profil (Bottom)** memiliki background yang sama untuk menjaga keseimbangan visual.

**Background Class:**
`bg-gray-50/50`

**Border Line:**
- Header: Gunakan `border-b border-gray-100` (garis bawah)
- Profil: Gunakan `border-t border-gray-100` (garis atas)

---

## 4. Rebranding Modul Utama

Modul "Dashboard" sekarang adalah root utama. Jika ada link baru:
- Gunakan rute `/dashboard` sebagai pengganti `/dashboard-kesalahan-karyawan`.
- Ikon yang disarankan adalah `LayoutDashboard` dari Lucide.

---

**Tips AI:** Selalu gunakan file `docs/DESIGN_SYSTEM.md` sebagai referensi tambahan untuk font (Plus Jakarta Sans) dan warna Emerald yang digunakan sistem.
