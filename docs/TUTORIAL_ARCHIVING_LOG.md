# Tutorial: Sistem Archiving Log Aktivitas

**Tanggal Dibuat**: 10 April 2026  
**Relevan untuk**: Super Admin / Developer

---

## Apa Itu Archiving Log?

Tabel `activity_logs` terus bertumbuh setiap hari (568K+ baris per April 2026). Tanpa archiving, query akan makin lambat seiring waktu. Sistem archiving memindahkan log lama ke tabel terpisah (`activity_logs_archive`) agar tabel aktif tetap ramping.

---

## Arsitektur Sistem

```
activity_logs (aktif, query cepat)
    ↓ setelah 90 hari (kecuali DELETE)
activity_logs_archive (storage jangka panjang)
```

**Proteksi Forensik**: Log `action_type = 'DELETE'` **tidak pernah diarsip** — tetap di `activity_logs` selamanya sebagai bukti audit permanen.

---

## File yang Terlibat

| File | Fungsi |
|------|--------|
| `src/lib/schema.ts` | Definisi tabel `activity_logs_archive` |
| `src/app/api/cron/archive-logs/route.ts` | Logika archiving |
| `vercel.json` | Jadwal cron otomatis |

---

## Cara Kerja Cron Job

**Jadwal**: Setiap hari jam **02:00 UTC** (09:00 WIB)

**Alur eksekusi**:
1. Hitung baris eligible (`created_at < 90 hari` DAN `action_type != 'DELETE'`)
2. Copy ke `activity_logs_archive` dengan `INSERT OR IGNORE` (aman dari duplikat)
3. **Verifikasi**: pastikan jumlah baris di archive cocok sebelum menghapus
4. `DELETE` dari `activity_logs`
5. Catat hasil sebagai log `MAINTENANCE` baru

---

## Cara Uji Manual (Development)

### Via Browser (perlu autentikasi)
```
GET http://localhost:3000/api/cron/archive-logs
```

### Via curl dengan CRON_SECRET
```bash
curl -H "Authorization: Bearer <isi_CRON_SECRET_dari_.env>" \
  http://localhost:3000/api/cron/archive-logs
```

### Respons sukses
```json
{
  "success": true,
  "message": "Berhasil mengarsip 1234 log aktivitas lama.",
  "archived": 1234,
  "cutoff": "2025-12-31 12:00:00",
  "policy": "Log DELETE tidak diarsip (disimpan permanen)."
}
```

### Respons jika tidak ada yang perlu diarsip
```json
{
  "success": true,
  "message": "Tidak ada log yang perlu diarsip.",
  "archived": 0
}
```

---

## Cara Menambah/Mengubah Periode Retensi

Buka `src/app/api/cron/archive-logs/route.ts`, ubah angka `90`:

```typescript
// Ubah 90 menjadi angka hari yang diinginkan
cutoffDate.setDate(cutoffDate.getDate() - 90);
```

---

## Cara Query Data Arsip (SQL)

```sql
-- Lihat total baris di arsip
SELECT COUNT(*) FROM activity_logs_archive;

-- Lihat arsip terbaru
SELECT * FROM activity_logs_archive ORDER BY archived_at DESC LIMIT 10;

-- Cari arsip berdasarkan user
SELECT * FROM activity_logs_archive WHERE recorded_by = 'nauval';

-- Log DELETE yang tidak pernah diarsip (selalu ada di tabel aktif)
SELECT COUNT(*) FROM activity_logs WHERE action_type = 'DELETE';
```

---

## Troubleshooting

### "Verifikasi arsip gagal"
Artinya proses copy ke archive tidak lengkap sebelum delete dilakukan. Sistem membatalkan penghapusan secara otomatis — data **tidak hilang**. Cek log error di Vercel Dashboard → Functions → `/api/cron/archive-logs`.

### Cron tidak berjalan di Vercel
1. Pastikan `vercel.json` sudah di-push ke production
2. Cek di Vercel Dashboard → Settings → Cron Jobs
3. Vercel Cron hanya aktif di environment **Production** (bukan Preview)

### Menjalankan manual di Production
```
GET https://sintak-app.vercel.app/api/cron/archive-logs
Authorization: Bearer <CRON_SECRET>
```
