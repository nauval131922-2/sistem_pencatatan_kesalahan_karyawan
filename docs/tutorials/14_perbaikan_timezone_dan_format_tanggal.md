# Tutorial: Perbaikan Timezone dan Format Tanggal (WIB)

Tutorial ini menjelaskan cara menangani masalah perbedaan zona waktu antara server (UTC) dan klien (WIB) pada aplikasi SINTAK, serta cara menstandarisasi format tanggal "Terakhir Diperbarui".

## Masalah
1. **Zona Waktu Berbeda**: Server produksi seringkali menggunakan UTC, sementara data harus ditampilkan dalam WIB (UTC+7). Jika menggunakan `new Date().getHours()`, hasilnya akan meleset 7 jam.
2. **Duplikasi Logika**: Kode manipulasi string tanggal (seperti `replace(' ', 'T') + 'Z'`) tersebar di banyak file `page.tsx`.

## Solusi Step-by-Step

### 1. Standarisasi di Utility Date (`src/lib/date-utils.ts`)
Gunakan `Intl.DateTimeFormat` dengan opsi `timeZone: 'Asia/Jakarta'` untuk memaksa format selalu dalam WIB.

```typescript
export function formatLastUpdate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  
  let date: Date;
  if (typeof dateInput === 'string') {
    let validStr = dateInput;
    // Ubah format SQLite (spasi) ke ISO (T) dan tambahkan 'Z' agar dianggap UTC
    if (!validStr.includes('Z') && !validStr.includes('+')) {
      validStr = validStr.replace(' ', 'T') + 'Z';
    }
    date = new Date(validStr);
  } else {
    date = dateInput;
  }
  
  if (isNaN(date.getTime())) return '';

  // Paksa zona waktu Asia/Jakarta
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const day = findPart('day').padStart(2, '0');
  const monthIdx = parseInt(findPart('month')) - 1;
  const year = findPart('year');
  const hours = findPart('hour').padStart(2, '0');
  const minutes = findPart('minute').padStart(2, '0');
  const seconds = findPart('second').padStart(2, '0');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[monthIdx];

  return `${day} ${month} ${year}, ${hours}.${minutes}.${seconds}`;
}
```

### 2. Sederhanakan Implementasi di Page Component
Karena logika sudah dipindah ke utility, file `page.tsx` tidak perlu lagi melakukan manipulasi string manual.

**Sebelum:**
```typescript
let dateString = lastImport.created_at as string;
if (!dateString.includes("T")) dateString = dateString.replace(" ", "T");
if (!dateString.endsWith("Z")) dateString += "Z";
const d = new Date(dateString);
importTime = formatLastUpdate(d);
```

**Sesudah:**
```typescript
importTime = formatLastUpdate(lastImport.created_at as string);
```

### 3. Penanganan di Server Actions (`src/lib/actions.ts`)
Saat menyimpan data baru (misalnya `addInfraction`), pastikan waktu yang diambil juga menggunakan zona waktu Jakarta jika server berjalan dalam UTC.

```typescript
const time = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta'
}).format(new Date());
```

## Kesimpulan
Dengan memusatkan logika format ke `Intl.DateTimeFormat` dengan `timeZone` yang spesifik, tampilan waktu akan konsisten di mana pun aplikasi di-deploy (Vercel, VPS lokal, atau PC Kantor).
