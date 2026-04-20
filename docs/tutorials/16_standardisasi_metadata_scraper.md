# Tutorial Mandiri: Standardisasi Metadata Scraper & Format Tanggal

Tutorial ini menjelaskan cara memastikan label "Diperbarui" pada modul scraper SINTAK ERP tetap konsisten dengan rentang tanggal yang dipilih user (bukan tanggal chunk bulanan) dan cara memformat waktu update secara seragam.

## 1. Konsep Metadata Scraper (`metaStart` & `metaEnd`)

SINTAK menggunakan teknik *chunking* (memecah rentang tanggal besar menjadi per bulan) untuk mempercepat proses scraping. Tanpa metadata khusus, backend hanya tahu tanggal awal/akhir dari *chunk* yang sedang diproses, sehingga label di UI bisa "melompat" ke tanggal awal bulan.

### Cara Kerja:
- **Client**: Mengirim `start` & `end` (untuk data chunk) DAN `metaStart` & `metaEnd` (rentang asli yang dipilih user).
- **Backend**: Menyimpan `metaStart` & `metaEnd` ke tabel `system_settings` sebagai representasi periode terakhir yang ditarik.
- **UI**: Menampilkan periode tersebut menggunakan utilitas `formatScrapedPeriodDate`.

---

## 2. Standardisasi pada Client-Side (Next.js)

Setiap modul scraper (misal: `OrderProduksiClient.tsx`, `RekapSalesOrderClient.tsx`) harus mengikuti pola berikut:

### A. Pastikan Import Utilitas yang Benar
```tsx
import { formatLastUpdate, splitDateRangeIntoMonths } from '@/lib/date-utils';
import { 
  formatScrapedPeriodDate, 
  persistScraperPeriod, 
  hydrateScraperPeriod 
} from '@/lib/scraper-period';
```

### B. Kirim Metadata saat Fetching Chunk
Di dalam fungsi `handleFetch` atau `handleFetchDigit`, pastikan query string menyertakan `metaStart` dan `metaEnd`.

```tsx
// Contoh di SalesOrderClient.tsx
const startStr = formatDateToYYYYMMDD(startDate);
const endStr = formatDateToYYYYMMDD(endDate);

const processChunk = async (chunk: any) => {
  const res = await fetch(
    `/api/scrape-orders?start=${chunk.start}&end=${chunk.end}&metaStart=${startStr}&metaEnd=${endStr}`
  );
  // ...
};
```

### C. Update State "Diperbarui" secara Seragam
Gunakan `formatLastUpdate` untuk mengupdate label waktu terakhir data ditarik.

```tsx
if (res.ok) {
  // ...
  setLastUpdated(formatLastUpdate(new Date()));
}
```

---

## 3. Standardisasi pada Backend (API Route)

Backend harus menangkap parameter metadata dan menyimpannya.

```typescript
// Contoh di api/scrape-orders/route.ts
const metaStart = searchParams.get('metaStart');
const metaEnd = searchParams.get('metaEnd');

if (metaStart && metaEnd) {
  const periodKey = getScrapedPeriodSettingKey('order_produksi'); // Sesuaikan kuncinya
  await db.insert(systemSettings).values({
    key: periodKey,
    value: encodeScrapedPeriod(metaStart, metaEnd),
    updated_at: new Date()
  }).onConflictDoUpdate({
    target: [systemSettings.key],
    set: { 
      value: encodeScrapedPeriod(metaStart, metaEnd), 
      updated_at: new Date() 
    }
  });
}
```

---

## 4. Penanganan Format Tanggal & Timezone (WIB)

Gunakan selalu fungsi `formatLastUpdate` dari `@/lib/date-utils.ts`. Fungsi ini telah dioptimalkan untuk:
1.  **Memaksa Timezone Asia/Jakarta (WIB)**: Menghindari perbedaan waktu antara server production (UTC) dan browser user.
2.  **Format Seragam**: `20 Apr 2026, 08.50.12`.
3.  **Robustness**: Menangani format tanggal dari SQLite/LibSQL yang terkadang tidak memiliki penanda timezone.

### Cara Penggunaan:
```tsx
// Di Page Server Component
const importTime = formatLastUpdate(lastImport.created_at);

// Di Client Component
setLastUpdated(formatLastUpdate(new Date()));
```

---

## 5. Checklist Perbaikan jika Label Salah
Jika Anda menemukan label "Diperbarui" salah di production:
1.  **Cek Client**: Apakah `metaStart` & `metaEnd` sudah dikirim di URL fetch?
2.  **Cek Backend**: Apakah API route sudah menyimpan `metaStart` & `metaEnd` ke `system_settings`?
3.  **Cek Formatter**: Pastikan menggunakan `formatLastUpdate` (bukan `toLocaleString` manual) untuk memastikan timezone WIB.
4.  **Cek Hydration**: Pastikan `hydrateScraperPeriod` dipanggil di `useEffect` awal untuk memuat status dari localStorage.
