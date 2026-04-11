# Tutorial: Memperbaiki Issue 403 Saat Login (Smart Redirect Berdasarkan Role)

**Masalah:**  
Sebelumnya, ketika pengguna login dan mereka tidak memiliki izin untuk melihat modul `/dashboard` (Umum), aplikasi memberikan error **403 - Akses Ditolak**. Hal ini karena sistem secara *hardcode* melempar semua orang yang baru login ke halaman dashboard.

**Konsep Solusi:**  
Kita membuat sebuah fungsi yang mendeteksi "rute valid pertama" milik user berdasarkan hak akses *(permissions)* yang ia miliki di database, lalu mengarahkan *(redirect)* mereka ke sana setelah login, bukan ke `/dashboard`.

---

### Langkah-Langkah Perbaikan (Step-by-step)

#### 1. Memusatkan Pemetaan Modul ke Rute (`src/lib/permissions.ts`)
Agar sistem tahu "jika user punya akses `penjualan_so`, maka halamannya adalah `/sales-orders`", kita perlu membuat pemetaannya secara berurutan *(Array of Objects)*.

```typescript
const MODULE_TO_ROUTE = [
  { key: 'dashboard',             route: '/dashboard' },
  { key: 'penjualan_so',          route: '/sales-orders' },
  { key: 'kalkulasi_rekap_so',    route: '/rekap-sales-order' },
  // ... seterusnya sesuai dengan modul yang ada
];
```

#### 2. Membuat Fungsi `getFirstAccessibleRoute`
Di *file* yang sama (`permissions.ts`), kita membuat fungsi yang akan menelusuri array di atas, mengecek satu per satu apakah user Punya Akses (`userPermissions[key]`), dan mereturn rutenya jika iya.

```typescript
export async function getFirstAccessibleRoute(userPermissions: Record<string, boolean>): Promise<string> {
  for (const { key, route } of MODULE_TO_ROUTE) {
    if (userPermissions[key] === true) {
      return route;
    }
  }
  return '/dashboard'; // Fallback aman
}
```

#### 3. Menggunakannya di Proses Autentikasi (`src/lib/auth.ts`)
Setiap kali sesi divalidasi (melewati middleware atau dipanggil via fungsi inti `getSession`), kita menggunakan fungsi tadi untuk memberikan properti `.defaultRoute`.

```typescript
// Ambil permissions dari DB
const permissionsRecord = await getMergedPermissions(user.role);

// Tentukan rute jatuhnya
let defaultRoute = '/dashboard';
if (user.role !== 'Super Admin') {
  defaultRoute = await getFirstAccessibleRoute(permissionsRecord);
}

// Kembalikan objek session
return {
  ...user,
  defaultRoute,
  permissions: permissionsRecord
}
```

#### 4. Memperbarui File yang Meng-handle Login & Root (`login/LoginContent.tsx` dan `page.tsx`)
Terakhir, saat form login berhasil, kita membaca properti `defaultRoute` yang baru saja kita atur, lalu mengarahkan `router.push(defaultRoute)` alih-alih `router.push('/dashboard')`.

```tsx
// Di LoginContent.tsx (saat fetch /api/login berhasil):
window.location.href = session.defaultRoute || '/dashboard';

// Di src/app/page.tsx (halaman akar http://localhost/):
const session = await getSession();
if (session?.defaultRoute) {
  redirect(session.defaultRoute);
}
```

---
**Hasil Akhir:**  
Pengguna dengan izin akun terbatas akan langsung dilempar ke halaman pertama yang bisa dia akses (Misal: `/rekap-sales-order`). Issue 403 pasca-login terselesaikan!
