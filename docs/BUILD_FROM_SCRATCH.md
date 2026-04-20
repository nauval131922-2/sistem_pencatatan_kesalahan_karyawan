# 🏗️ BUILD_FROM_SCRATCH.md

Tutorial ini adalah panduan lengkap untuk membangun ulang sistem **SINTAK ERP** (Sistem Pencatatan Kesalahan Karyawan & Manufaktur) dari nol hingga menghasilkan sistem yang identik dengan kondisi saat ini.

---

## 📌 Bagian 1: Gambaran Umum Sistem
Sistem ini adalah aplikasi Enterprise Resource Planning (ERP) kustom yang dirancang untuk pabrik manufaktur (PT Buya Barokah). Sistem ini mencakup manajemen user (RBAC), tracking manufaktur (BOM, Bahan Baku, Barang Jadi, SOPd, Master Pekerjaan), sistem *scraping* otomatis (Cron Jobs), dan audit logs dinamis.

**Tech Stack:**
- **Framework Utama**: Next.js 16.1.6 (App Router) & React 19.2.3.
- **Styling**: TailwindCSS v4.
- **Database**: LibSQL (SQLite) yang kompatibel dengan Turso Cloud. Library: `@libsql/client`.
- **Autentikasi**: Custom JWT menggunakan `jose` & `bcryptjs`.
- **UI Components**: `@tanstack/react-table`, `lucide-react`, `recharts`, `jspdf`, `xlsx`.
- **Infrastruktur**: Vercel (Edge Caching, Serverless Functions, Cron).

**Arsitektur:**
Sistem menggunakan pola arsitektur *Monolithic Serverless*. Klien (*Browser*) berinteraksi dengan Server (*Next.js API Routes*) yang mengeksekusi *SQL queries* secara asinkron ke *Database* (LibSQL/Turso). 

---

## 📌 Bagian 2: Prasyarat & Persiapan Lingkungan
1. **Node.js**: Versi 20.x atau terbaru.
2. **Paket Manajer**: npm (bawaan Node.js).
3. **Git**: Untuk version control.
4. **Akun Turso**: Untuk database production (opsional untuk *local development*).
5. **Akun Vercel**: Untuk deployment dan Cron Jobs.

**Verifikasi:**
Jalankan perintah ini di terminal:
```bash
node -v # Harus v20+
npm -v
```

---

## 📌 Bagian 3: Inisialisasi Proyek

1. **Buat Folder Proyek:**
```bash
mkdir sintak_pt_buya_barokah
cd sintak_pt_buya_barokah
```

2. **Inisialisasi Next.js (Manual Mode):**
Buat file `package.json`:
```json
{
  "name": "sistem_pencatatan_kesalahan_karyawan",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "init-db": "npx tsx scripts/init-db.ts",
    "init-db:dev": "npx tsx -e \"process.env.DB_PATH='database_dev.sqlite'\" scripts/init-db.ts",
    "prebuild": "npm run init-db"
  },
  "dependencies": {
    "@libsql/client": "^0.17.0",
    "@tanstack/react-table": "^8.21.3",
    "@tanstack/react-virtual": "^3.13.22",
    "@vercel/analytics": "^2.0.1",
    "@vercel/speed-insights": "^2.0.0",
    "bcryptjs": "^3.0.3",
    "jose": "^6.2.0",
    "jspdf": "^4.2.0",
    "jspdf-autotable": "^5.0.7",
    "lucide-react": "^0.575.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^3.7.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "typescript": "^5"
  }
}
```

3. **Install Dependensi:**
```bash
npm install
```

4. **Konfigurasi .gitignore:**
Buat file `.gitignore`:
```text
/node_modules
/.pnp
.pnp.*
/coverage
/.next/
/out/
/build
.DS_Store
*.pem
/tmp/
npm-debug.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example
.vercel
*.tsbuildinfo
next-env.d.ts
*.sqlite
*.sqlite-wal
*.sqlite-shm
local.db
local.db-journal
local.db-shm
local.db-wal
/Referensi
```

---

## 📌 Bagian 4: Struktur Folder & File
Buat struktur direktori berikut di dalam root folder:

```
sintak_pt_buya_barokah/
├── .env.example
├── .env.development
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
├── scripts/
│   └── init-db.ts
└── src/
    ├── app/
    │   ├── api/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── PageHeader.tsx
    │   └── DataTable.tsx
    └── lib/
        ├── db.ts
        ├── schema.ts
        ├── session.ts
        └── permissions.ts
```

---

## 📌 Bagian 5: Konfigurasi Environment

1. Buat file `.env.example`:
```env
# URL Database (Lokal gunakan format file:)
DB_PATH=database.sqlite
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Rahasia JWT
JWT_SECRET=super_secret_key_change_in_production

# Flag penggunaan database
USE_REMOTE_DB=false
```

2. Buat file `.env.development` untuk environment dev lokal:
```env
# Development environment — only loaded by `npm run dev`
DB_PATH=database_dev.sqlite
USE_REMOTE_DB=false
```

3. Salin `.env.example` ke `.env` dan sesuaikan nilainya.

---

## 📌 Bagian 6: Setup Database

### 1. Engine Database (`src/lib/db.ts`)
Buat file untuk instance database yang bisa mendeteksi environment lokal vs cloud:

```typescript
import { createClient } from '@libsql/client';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;
const useRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (useRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
} else {
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.join(process.cwd(), process.env.DB_PATH || defaultDbName);
  dbUrl = `file:${dbPath}`;
}

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Wrapper untuk batch & context
const db = {
  ...client,
  async execute(stmt: any) {
    return await client.execute(stmt);
  },
  async batch(stmts: any[], mode?: any) {
    return await client.batch(stmts, mode);
  }
};

export default db;
```

### 2. Skema Tabel (`src/lib/schema.ts`)
Buat definisi skema untuk diinisialisasi secara otomatis:

```typescript
export async function initSchema(db: any) {
  try {
    const executor = db.client || db;
    if (executor.execute) {
      await executor.execute("PRAGMA busy_timeout = 5000;");
      await executor.execute("PRAGMA journal_mode = WAL;");
    }
  } catch(e) {}

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS app_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      module_key TEXT NOT NULL,
      can_access INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, module_key)
    );`,
    // Tabel Data Manufaktur
    `CREATE TABLE IF NOT EXISTS master_pekerjaan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      sub_category TEXT,
      group_pekerjaan TEXT,
      target_value REAL,
      standart_target REAL,
      ket_1 TEXT,
      unit_mesin TEXT,
      target_per_hari REAL,
      target_per_jam REAL,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ], "write");

  // Seeding Default Role & Permissions
  try {
    const executor = db.client || db;
    const res = await executor.execute("SELECT COUNT(*) as c FROM app_roles");
    if (res.rows[0].c === 0) {
      await executor.execute("INSERT INTO app_roles (role_name) VALUES ('Admin');");
      await db.batch([
        "INSERT INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'dashboard', 1);",
        "INSERT INTO role_permissions (role, module_key, can_access) VALUES ('Admin', 'master_pekerjaan', 1);"
      ], "write");
    }
  } catch(e) {}
}
```

### 3. Skrip Inisialisasi (`scripts/init-db.ts`)
```typescript
import { createClient } from '@libsql/client';
import path from 'path';
import { initSchema } from '../src/lib/schema';

async function main() {
  const dbUrl = `file:${path.join(process.cwd(), 'database_dev.sqlite')}`;
  const db = createClient({ url: dbUrl });
  await initSchema(db);
  console.log("DB Init Success!");
}
main();
```

Jalankan perintah ini untuk verifikasi:
```bash
npm run init-db:dev
```
Jika sukses, file `database_dev.sqlite` akan muncul di root folder.

---

## 📌 Bagian 7: Implementasi Fitur Dasar

Sistem ini bersifat modular. Berikut adalah fondasi fitur autentikasi dan satu modul data (Master Pekerjaan) yang mewakili seluruh arsitektur fitur lainnya.

### Fitur 1: Autentikasi (JWT)
**Deskripsi:** Sistem login tanpa status (stateless) menggunakan *HTTP-Only Cookies*.

**Langkah:**
1. Buat `src/lib/session.ts`:
```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'secret';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
```

### Fitur 2: Master Pekerjaan (Modul Standar)
**Deskripsi:** Modul CRUD standar untuk mengelola data referensi target pabrik. Fitur ini mewakili struktur dasar untuk fitur lain seperti SOPd, BOM, dan Bahan Baku.

1. **API Route (`src/app/api/master-pekerjaan/route.ts`)**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  let query = 'SELECT * FROM master_pekerjaan WHERE 1=1';
  let args = [];
  if (search) {
    query += ' AND (name LIKE ? OR code LIKE ?)';
    args.push(`%${search}%`, `%${search}%`);
  }
  const result = await db.execute({ sql: query, args });
  return NextResponse.json({ success: true, data: result.rows });
}
```

2. **Client Component UI (`src/app/master-pekerjaan/Client.tsx`)**:
*(Catatan: Menggunakan `@tanstack/react-table` untuk performa).*
```tsx
'use client';
import { useEffect, useState } from 'react';

export default function MasterPekerjaanClient() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/master-pekerjaan').then(r => r.json()).then(d => setData(d.data));
  }, []);

  return (
    <table className="w-full border">
      <thead><tr><th>Kode</th><th>Nama</th></tr></thead>
      <tbody>
        {data.map((row: any) => (
          <tr key={row.code}><td>{row.code}</td><td>{row.name}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Fitur 3: Import/Export Excel dengan Fuzzy Matching
**Deskripsi:** Modul untuk membaca file `.xls`/`.xlsx` dan mencocokkan header secara cerdas tanpa format baris yang kaku. Digunakan di SOPd dan Master Pekerjaan.

**Langkah Implementasi:**
Menggunakan library `xlsx`. Baca Array Buffer di Client Component:
```typescript
const XLSX = await import('xlsx');
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { cellFormula: false, cellNF: true, cellText: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Algoritma Fuzzy Matching: Mencari baris yang mengandung keyword spesifik
let headerRowIndex = -1;
for (let r = 0; r < Math.min(20, rawData.length); r++) {
  const rowStrings = (rawData[r] || []).map(v => v ? String(v).toUpperCase() : '');
  if (rowStrings.some(v => v.includes('NAMA BARANG') || v.includes('KODE'))) {
    headerRowIndex = r;
    break;
  }
}
```

### Fitur 4: Digit Suite Scraper & Cron Job
**Deskripsi:** Sistem batch-scraping bulanan dari API pihak ketiga.
**File:** `src/app/api/cron/sync-daily/route.ts` dan berbagai Endpoint Scraper (BOM, SPPH, PR, dll).
**Langkah Implementasi:**
1. Setup cron di `vercel.json` (Lihat Bagian 8).
2. Buat endpoint yang di-trigger oleh Vercel menggunakan otentikasi Bearer Header.
```typescript
// Contoh endpoint cron
import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // Panggil fetch internal ke /api/bom/sync, /api/sopd/sync, dst.
  return NextResponse.json({ success: true });
}
```

### Fitur 5: Audit Log & Pengarsipan Dinamis
**Deskripsi:** Sistem melacak setiap perubahan (Upload, Edit, Hapus).
**Langkah Implementasi:**
1. Tabel `activity_logs` dan `activity_logs_archive` di `schema.ts`.
2. Injeksi log dilakukan secara eksplisit pada setiap API POST/PATCH (Contoh: `/api/sopd/route.ts`).
```typescript
import { getSession } from '@/lib/session';
const session = await getSession();
await db.execute({
  sql: `INSERT INTO activity_logs (action_type, table_name, record_id, message, raw_data, recorded_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
  args: ['UPDATE', 'sopd', id, 'Perubahan Data SOPd', JSON.stringify(changes), session?.username]
});
```

### Fitur 6: Laporan PDF & Grafis (Chart)
**Deskripsi:** Export data ke format PDF dan visualisasi statistik produksi.
**Langkah Implementasi:**
Menggunakan `jspdf-autotable` untuk tabel dan `recharts` untuk dashboard.
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
doc.text('Laporan Produksi', 14, 15);
autoTable(doc, {
  head: [['Kode', 'Nama', 'Target']],
  body: data.map(item => [item.code, item.name, item.target]),
  startY: 20,
});
doc.save('laporan.pdf');
```

---

## 📌 Bagian 8: Integrasi & Konfigurasi Tambahan

### Vercel Cron Jobs (`vercel.json`)
Sistem ini mengotomatiskan sinkronisasi (Scraper) dan arsip log setiap hari.
```json
{
  "crons": [
    {
      "path": "/api/cron/archive-logs",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/sync-daily",
      "schedule": "0 3 * * *"
    }
  ]
}
```
*(File ini otomatis dibaca oleh Vercel saat di-deploy).*

---

## 📌 Bagian 9: Menjalankan Sistem

1. **Jalankan Mode Development (Lokal):**
```bash
npm run dev
```
Buka `http://localhost:3000`.

2. **Jalankan Mode Production (Build):**
```bash
npm run build
npm start
```

**Cara Verifikasi:**
- Database `database_dev.sqlite` muncul.
- Buka browser, UI autentikasi atau halaman dashboard akan muncul tanpa error 500.

---

## 📌 Bagian 10: Troubleshooting

1. **Error `SQLITE_BUSY` atau Database Terkunci:**
   - **Penyebab**: Koneksi database berebut di *Hot Reload* Next.js.
   - **Solusi**: Pastikan `PRAGMA journal_mode = WAL;` berjalan di `schema.ts`. Jika masalah persisten, matikan proses Node.js di Task Manager dan jalankan ulang `npm run dev`.

2. **Error `Cannot find module '@libsql/client'` di Vercel:**
   - **Penyebab**: Ketergantungan asli SQLite (`better-sqlite3`) bentrok di Vercel Edge.
   - **Solusi**: Sistem ini murni menggunakan `@libsql/client` (Async). Jangan meng-install `better-sqlite3`.

3. **Label "Diperbarui" Kembali ke Tanggal 1 (Label Drift):**
   - **Penyebab**: Sifat pemisahan rentang bulan pada *Batch Scraper*.
   - **Solusi**: Pastikan parameter `metaStart` dan `metaEnd` dikirim di endpoint Cron/Sync dari Client.

---
> ⚠️ **PENTING**: Tutorial ini menjabarkan fondasi inti sistem. SINTAK ERP memiliki puluhan komponen (`DataTable`, `Sidebar`) dan entitas database lain. Pola pembuatannya **sama persis** dengan arsitektur pada Bagian 7. Jika Anda ingin merestore sistem sepenuhnya, *clone* sisa modul sesuai definisi tabel di `schema.ts`.
