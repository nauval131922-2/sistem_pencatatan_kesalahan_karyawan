# Referensi Istilah UI/UX & Frontend Web

Dokumen ini berisi kumpulan istilah teknis seputar pengembangan antarmuka (User Interface) dan pengalaman pengguna (User Experience) pada pengembangan web modern. Referensi ini sangat relevan untuk project sistem aplikasi berskala besar seperti SIKKA, dan bisa digunakan sebagai panduan untuk merancang sistem-sistem selanjutnya.

---

## 🏗️ 1. Struktur & Layout (Tata Letak)

### **Viewport-Locked (Penguncian Viewport)**
Teknik layout di mana tinggi aplikasi web secara ketat dikunci agar sama persis dengan tinggi layar perangkat penggunanya (`height: 100vh` atau `h-screen`). 
*   **Fungsi:** Mencegah seluruh halaman (*body*) dari tergulir (scrolling) ke bawah. Area yang bisa digulir hanya dibatasi pada komponen tertentu saja (misal: bagian isi tabel atau area konten tengah saja).
*   **Kapan digunakan:** Sangat umum di aplikasi *Dashboard*, *Web App* bergaya desktop (seperti Notion, Gmail, ERP), atau aplikasi chat.

### **Infinity Scroll (Gulir Tak Terbatas)**
Sebuah pola desain pemuatan data (*data fetching*) di mana konten halaman berikutnya akan dimuat dan ditambahkan secara otomatis ke bagian bawah daftar ketika pengguna men-*scroll* mendekati akhir elemen.
*   **Fungsi:** Menggantikan desain `Paginasi` klasik (halaman 1, 2, 3..). Membuat pengalaman menelusuri ratusan atau ribuan baris data terasa sangat mulus ("seamless").
*   **Syarat idealnya:** Membutuhkan wadah (container) yang `overflow-y-auto` agar browser tahu batasan scroll-nya untuk memicu pengambilan data (Fetch API).

### **Sticky / Fixed Positioning**
*   **Sticky**: Elemen halaman (seperti header tabel) yang awalnya ikut tergulir, namun ketika mencapai batas layar atas (atau posisi tertentu), elemen tersebut akan 'menempel' (sticky).
*   **Fixed**: Elemen (seperti menu navigasi bawah di HP) yang selalu terkunci posisinya relatif terhadap layar jendela browser, tidak peduli sejauh apa halaman digulir.

### **Absolute Positoning**
Digunakan untuk mencabut sebuah komponen dari alur dokumen (*document flow*) utama, lalu memposisikannya secara mutlak (absolute) di sudut tertentu (misal: Pojok Kanan Atas). Ini yang kita aplikasikan pada komponen Header Profil SIKKA agar tidak saling dorong (memakan *space*) dengan elemen judul Halaman.

### **Z-Index (Konteks Tumpukan)**
Konsep yang mengatur elemen mana yang berada "di atas" atau "di depan" elemen lain jika posisinya saling menumpuk. Header yang mengambang atau Modal/Popup biasanya diberi Z-Index yang sangat tinggi (misal `z-40` atau `z-50`) agar menutupi seluruh konten lain di belakangnya.

---

## 🏎️ 2. Kinerja & Pengelolaan Data (Performance)

### **Debounce / Debouncing**
Teknik pemrograman untuk membatasi seberapa sering sebuah *function* dijalankan secara beruntun.
*   **Contoh Kasus:** Pada kolom **Pencarian (Search Bar)**. Jika kita memakai *debounce* sebesar 500ms, maka sistem SIKKA baru akan melakukan kueri (*query*) pencarian ke *database* setelah pengguna berhenti mengetik selama setengah detik. Hal ini mencegah *server/database* jebol akibat harus mencari data setiap huruf ditekan (B... Bu... Budi..).

### **Throttling**
Mirip dengan *Debounce*, tetapi bedanya *Throttling* menjamin fungsi akan tetap dieksekusi secara konsisten dalam interval waktu tertentu (misal: maksimal 1 kali setiap 2 detik), tidak peduli berapa kali pengguna menyerangnya. Sering diterapkan saat menangani interaksi *resize* layar atau event *Infinity Scroll*.

### **Skeleton Loader / Shimmer Effect**
Animasi *placeholder* sementara yang bentuknya mengikuti kerangka asli dari kartu atau tabel sebelum data sebenarnya berhasil dimuat dari server. Memberikan ilusi performa bahwa aplikasi "bekerja dengan cepat" dibandingkan menggunakan hanya logo *Spinner* (lingkaran berputar).

### **Hydration**
Istilah spesifik di kerangka kerja (framework) seperti React/Next.js. Ini adalah proses "menghidupkan" HTML statis yang dikirim dari server dengan menyuntikkan (attach) event pendengar (seperti fungsi klik tombol) ke dalamnya setibanya di browser klien (Client-Side).

---

## 📐 3. Kerangka Interaksi Pengguna (User Interaction)

### **Optimistic UI (Pembaruan UI Optimis)**
Pendekatan merancang aplikasi yang seketika memperbarui antar-muka langsung setelah pengguna mengklik sesuatu, dengan asumsi operasi *server* akan berhasil di belakang layar.
*   **Contoh:** Saat Anda mengirim chat WhatsApp atau melakukan *Like* di Instagram, pesannya langsung muncul/logo hati langsung merah, meskipun *loading* jaringan sebenarnya masih terjadi. Jika sistem gagal memproses, UI baru memunculkan pesan error dan mengembalikan kondisi (kembali abu-abu/dikembalikan). Kelebihannya membuat aplikasi terasa instan bebas dari ngelag.

### **Breadcrumbs (Jejak Roti)**
Elemen navigasi berhirarki (biasanya di kiri atas) yang menunjukkan lokasi pengguna saat ini (Contoh: `Beranda > Data Master > Karyawan > Tambah Karyawan`). Sangat esensial untuk sistem dengan navigasi ke dalam (nested) agar *user* tidak tersesat.

### **Toast / Notification Banner**
Pemberitahuan kecil (biasanya muncul sesaat di pinggir pojok kanan/bawah) yang menginformasikan kepada pengguna bahwa tindakan mereka (misal: "Disimpan", "Dihapus", "Terjadi Kesalahan") telah terjadi tanpa harus mengganggu apa yang sedang pengguna kerjakan (tidak menghentikan *workflow* layaknya dialog peringatan *Alert* konvensional).

### **Modal / Dialog / Drawer**
*   **Modal**: Kotak (jendela) peringatan/formulir yang muncul di tengah layer, dan menonaktifkan sisa layar abu-abu/gelap (*backdrop*) di belakangnya.
*   **Drawer (Laci)**: Panel samping pembantu yang akan ditarik meluncur keluar dari tepian layar. Digunakan jika informasi yang ditampilkan cukup banyak dan rumit untuk diletakkan di dalam *Modal*, tapi tidak ingin mengarahkan pengguna untuk berpindah halaman.
