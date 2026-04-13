# Implementasi Fitur Parse Excel Tahan Banting (Fuzzy Column Mapping)

Saat melakukan pembacaan file upload berbentuk `*.xls` atau `*.xlsx` hasil extract dari alat atau template lama, format header (judul kolom) kadang tidak seragam dan sering diimbuhi karakter-karakter spesifik di Excel-nya (misalnya: `No_SOPd ❶a`). Mem-*hardcode* referensi index baris dan nama kolom akan rentan error jika besoknya file template ada sedikit perbedaan karakter spasi.

Berikut cara yang SINTAK gunakan dalam module **Data Produksi / Excel SOPd** untuk mengatasi hal tersebut.

## 1. Gunakan Helper *Fuzzy Search Key*

Daripada menembak eksak `"No_SOPd" === key`, gunakan fungsi iteratif sederhana dengan `includes()` lalu normalisasi hurufnya menjadi kecil/lowercase terlebih dahulu.

**Contoh Kode di Front-End Component (`SopdExcelUpload.tsx`):**

```typescript
const mappedData = rawData.map((row: any) => {
    
    // Fungsi bantuan pencari Key (nama property json dari column)
    const findKey = (searchStr: string) => {
        const keys = Object.keys(row);
        return keys.find(k => k.toLowerCase().includes(searchStr.toLowerCase()));
    };

    // Mencari varian key kolom-nya.
    const keyNoSopd = findKey('No_SOPd'); 
    const keyNamaOrder = findKey('Nama_Order') || findKey('Nama Order');
    
    return {
        // Pemetaan menjadi state format JSON internal kita
        no_sopd: keyNoSopd ? row[keyNoSopd] : "",
        nama_order: keyNamaOrder ? row[keyNamaOrder] : ""
    };
});
```

Dengan sistem fallback seperti `findKey('Nama_Order') || findKey('Nama Order')`, maka jika penamaan judul Excel berubah dari `<spasi>` ke `_` (underscore), parser tetap akan berhasil menemukannya.

## 2. Setting Index "Header Offset" dengan Spesifik

Library XLSX (SheetJS) secara sadar menge-set baris paling utama atas (Row 1) sebagai parameter Header/Keys. Tetapi kasus dunia nyata, pengguna acapkali menggunakan row 1-4 untuk mendesain judul form, logo, alamat kop surat, dsb.
Dalam SINTAK, kita memakai parameter `{ range }`.
Di array `sheet_to_json`:

```typescript
// Melewati baris index [0, 1, 2, 3] dan memplot baris index [4] (row 5) di excel sebagai object key!
let rawData = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: "" });
```

## 3. Filter Clean Up untuk "Noise" Header Ganda

Terkadang dalam template export lama (contoh: *Report* bawaan lama atau accurate), Header dicetak berulang kali setiap cetak page baru, menjadikan nilai string `"No Orde"` muncul di data record ke #31.

**Cara handle-nya pakai `filter()` di mapping data:**

```typescript
const finalData = mappedData.filter((item) => {
    // 1. Abaikan / Buang jika baris kosong sepenuhnya
    if (!item.no_sopd && !item.nama_order) return false;
    
    // 2. Buang Jika isi Value Record-nya SAMA PERSIS dengan judulnya sendiri.
    const isHeaderText = 
        item.no_sopd?.toString().toLowerCase().includes('no') && 
        item.no_sopd?.toString().toLowerCase().includes('sopd');
        
    // Reverse Return (Kebalikannya): Jika benar = buang/false, Jika salah = ambil/true.
    return !isHeaderText; 
});
```

Dengan hal ini, segala bentuk anomali dari Excel Uploader bisa di filter dengan aman sebelum dikirim memakai route `POST /api/...`.
