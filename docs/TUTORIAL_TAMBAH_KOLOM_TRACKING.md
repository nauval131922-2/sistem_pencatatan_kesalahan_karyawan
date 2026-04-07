# Tutorial: Cara Menambah Kolom Baru di Tabel Tracking Manufaktur

Setiap kali Anda ingin menambahkan tahapan/kolom baru (contoh: *Pembelian Barang*) di halaman Tracking Manufaktur pada project SIKKA, Anda harus melakukan penyesuaian di dua layer utama: **Backend API** dan **Frontend UI**.

Berikut adalah alur *step-by-step* untuk melakukannya.

## File yang Terlibat
1. `src/app/api/tracking/route.ts` (API/Backend)
2. `src/app/tracking-manufaktur/TrackingClient.tsx` (UI/Frontend)

---

## Langkah 1: Manipulasi API Backend (`src/app/api/tracking/route.ts`)
Tugas pertama adalah memastikan API menarik data dari database dan merangkainya berkesinambungan dengan tahapan yang sudah didefinisikan sebelumnya. API harus menangkap hasil data tersebut agar dapat dikirim ke layer *client*.

**1. Menulis Logic Pencarian Database**
Kita memanfaatkan array hasil eksekusi tahapan sebelumnya. Misalnya dalam kasus *Pembelian Barang*, data tersebut direlasikan berdasarkan `faktur_po` yang didapat dari langkah *Purchase Order* sebelumnya.

```typescript
// Tambahkan snippet ini sesuai letak tahapan kronologis tabelnya (misalnya sebelum "return NextResponse.json")

let pembelianBarang: any[] = []; 

// poFakturs berisi kumpulan faktur_po hasil dari data Purchase Order sebelumnya.
if (poFakturs.length > 0) {
  // Buat mapping '?' untuk mensimulasikan query parameter aman (mencegah SQL Injection).
  const placeholders = poFakturs.map(() => '?').join(','); 
  
  // Lakukan query ke database berdasarkan relasi faktur spesifik tersebut
  const pbRes2 = await db.execute({
    sql: `SELECT * FROM rekap_pembelian_barang WHERE faktur_po IN (${placeholders})`,
    args: poFakturs
  });
  
  pembelianBarang = pbRes2.rows; // Simpan hasil eksekusi DB ke variabel array
}
```

**2. Mengirim ke Return Response API**
Setelah datanya ditarik, masukkan ke dalam object JSON. Pastikan agar row hasil query bisa ter-*parsing* dengan aman melalui fungsi bawaan `parseRawData()`.

```typescript
return NextResponse.json({
  success: true,
  data: {
    // ... data-data tahapan sebelumnya (BOM, SPH, PR, dsb)
    penerimaanPembelian: penerimaanPembelian.map(pb => parseRawData(pb)),

    // Sediakan response JSON ini agar terbaca di antarmuka frontend/layer client
    pembelianBarang: pembelianBarang.map(pb => parseRawData(pb))
  }
});
```

---

## Langkah 2: Manipulasi UI Frontend (`src/app/tracking-manufaktur/TrackingClient.tsx`)
Selanjutnya kita mendaftarkan kolom ini ke tabel yang berbasis `@tanstack/react-table`.

**1. Mendaftarkan Tipe Data di State Interface `trackingData`**
Agar TypeScript *strict* dan React bisa melacak eksistensi obyektif JSON yang baru, kita tambahkan ia pada definisi variable JSON API-nya:

```tsx
const [trackingData, setTrackingData] = useState<{
    bom: any;
    sphOut: any;
    // ...
    penerimaanPembelian: any[];
    pembelianBarang: any[]; // <--- Tambahkan field ini persis letaknya sesuai urutan yang logis
    id?: string;
} | null>(null);
```

**2. Membuat State Default untuk Pengaturan Lebar Kolom (Resizing)**
Setup initial untuk ukuran lebar kolom user. SIKKA menyimpan ukuran kolom ini di *Local Storage*, maka Anda harus memastikannya muncul di blok *default* nya, biasanya diset pada **500**.

```tsx
const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
   // Blok pengecekan localStorage:
   return saved ? JSON.parse(saved) : {
      // ...
      penerimaan_pembelian: 500,
      pembelian_barang: 500 // <--- Set awal lebar kolom 500px
   };
});
// (Lakukan hal ini di blok kedua 'return' di bawah conditional pengecekan local storage juga).
```

**3. Mendefinisikan Tampilan (Cell render) di dalam Tabel**
Cari variable konstan `const columns = useMemo<ColumnDef<any>[]>(() => [ ... ])` dan tambahkan blok obyek konfigurasi baru untuk kolom yang Anda kehendaki sesuai lokasinya.

```tsx
{
   id: 'pembelian_barang', // Key internal dari React Table
   header: 'Pembelian Barang', // Teks di heading atas tabel
   accessorKey: 'pembelianBarang', // WAJIB sesuai dengan key response JSON yang dikirim API route.ts di Langkah 1!
   size: columnWidths.pembelian_barang, // Binding statenya untuk fungsi drag/resize tabel
   meta: { wrap: true, valign: 'top' },
   cell: ({ row }) => {
      // row.original berisi object full JSON response.
      const items = row.original.pembelianBarang;
      
      // Kasus jika data belum di-Tarik/Scrape, atau tidak ada.
      if (!items || items.length === 0) return <div className={emptyStateClass}>Tidak Ada Data Pembelian Barang</div>;
      
      // Kasus jika ditemukan list datanya: mapping card komponen beserta text deskriptif logic referensinya 
      return (
         <div className="flex flex-col gap-2.5 pt-1.5 pb-3.5 w-full max-w-full overflow-hidden px-1">
            <div className="text-[10px] text-gray-400 mb-1">
               {items.length} Data Pembelian Barang 
               <span className="text-gray-500">(via Purchase Order.faktur = Pembelian Barang.faktur_po)</span>
            </div>
            
            {/* Keajaiban SIKKA: RenderAllFields yang akan mem-parsing secara otomatis atribut dalam row DB JSON */}
            {items.map((pb: any, idx: number) => (
               <div key={idx} className={`${cardClass} border border-slate-100`}>
                  <RenderAllFields data={pb} excludeKeys={['raw_data']} />
               </div>
            ))}
         </div>
      );
   }
}
```

Dengan langkah-langkah di atas, fitur ekspansi tabel tracking bisa dienkapsulasi dengan cepat tanpa merusak skema data tabel, serta seluruh rendering angkanya (Format Ribuan, dll) akan ditangani otomatis.

---

### *Catatan Tambahan (Edge Cases / Dirty Data)*
Terkadang, nilai faktur yang Anda simpan di database "kotor" karena tercampur tag HTML dari scraping (contoh: `<a href='...'>PJ1004</a>`).  
Jika menggunakan pencarian kaku (yaitu `WHERE faktur_so IN (...)` seperti contoh `route.ts` di atas), data tidak akan ditemukan. Anda harus menggunakan operasi logika `LIKE`:

```typescript
// Contoh untuk data Pengiriman yang fakturnya mengandung elemen HTML 
const criteria = lpFakturs.map(() => `faktur LIKE ?`).join(" OR ");
const args = lpFakturs.map(f => \`%\${f}%\`);

const pgRes = await db.execute({
  sql: \`SELECT * FROM pengiriman WHERE \${criteria}\`,
  args: args
});
```
