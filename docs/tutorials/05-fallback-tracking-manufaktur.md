# Tutorial 05: Fallback Logika Tracking Manufaktur

Tutorial ini menjelaskan implementasi mekanisme *safety net* pada fitur pelacakan manufaktur untuk menangani data produksi yang tidak memiliki relasi langsung ke Sales Order (SO).

## 1. Masalah: Data Produksi Terputus
Beberapa Order Produksi (OP) dibuat langsung melalui Bill of Material (BOM) tanpa melewati modul Sales Order. Hal ini menyebabkan data tersebut tidak muncul di dashboard tracking karena pencarian hanya mengandalkan relasi `PRD.FAKTUR_SO = SO.FAKTUR`.

## 2. Solusi: Fallback via BOM Faktur
Sistem diperbarui untuk melakukan pencarian tahap kedua jika relasi via SO gagal memberikan hasil.

### Langkah-langkah Implementasi:
1. **Backend API (`src/app/api/tracking/route.ts`)**:
   Menambahkan blok pencarian menggunakan `faktur_bom` sebagai kunci cadangan.
   
   ```typescript
   // Jika via SO tidak ketemu, coba via BOM
   if (!productionOrder) {
     const pOrderFallback = await db.execute({
       sql: `SELECT * FROM orders WHERE faktur_bom = ? LIMIT 1`,
       args: [item.faktur_bom]
     });
     if (pOrderFallback.rows.length > 0) {
       productionOrder = pOrderFallback.rows[0];
       isFromBom = true; // Flag untuk UI
     }
   }
   ```

2. **Frontend UI (`src/app/tracking-manufaktur/TrackingClient.tsx`)**:
   Memberikan informasi transparan kepada user mengenai logika pencarian yang digunakan pada kolom **Order Produksi**.

## 3. Hasil
Seluruh data produksi kini dapat dilacak terlepas dari apakah data tersebut berasal dari Sales Order atau langsung dari Bill of Material, memastikan tidak ada "blind spot" dalam pemantauan progres manufaktur.
