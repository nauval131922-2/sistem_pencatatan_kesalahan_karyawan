# 📂 tutorials/

Folder ini berisi tutorial step-by-step untuk setiap fitur atau perbaikan
yang dikerjakan selama pengembangan sistem.

## Konvensi Penamaan File

```
01-nama-fitur.md
02-nama-fitur-lain.md
03-perbaikan-bug-xxx.md
```

- Gunakan angka di depan untuk menjaga urutan kronologis
- Gunakan huruf kecil dan tanda hubung (kebab-case)
- Satu file per fitur atau perbaikan

## Struktur Setiap File Tutorial

Setiap file tutorial sebaiknya mengikuti struktur:

```markdown
# [Nama Fitur/Perbaikan]

## 🎯 Tujuan
Apa yang ingin dicapai dengan fitur/perbaikan ini.

## 📋 Prasyarat
Apa yang harus sudah ada/selesai sebelum mengikuti tutorial ini.

## 📝 Langkah-langkah
1. ...
2. ...
3. ...

## ✅ Verifikasi
Cara memastikan fitur/perbaikan berhasil.

## ⚠️ Catatan Penting
Hal-hal yang perlu diperhatikan.
```

---

> File-file tutorial akan otomatis dibuat/diperbarui oleh AI agent
> setiap kali menjalankan `COMMIT_INSTRUCTION.md`.
