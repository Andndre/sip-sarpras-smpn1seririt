# Sistem Peminjaman Sarana Prasarana (SIP Sarpras) - SMPN 1 Seririt

Aplikasi desktop untuk manajemen peminjaman sarana dan prasarana di SMPN 1 Seririt. Aplikasi ini dibangun menggunakan teknologi web modern yang dibungkus menjadi aplikasi desktop menggunakan Electron.

<div align="center">
  <img src="./public/logo.png" alt="Logo" width="150" />
</div>

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Ringkasan statistik peminjaman, barang tersedia, dan status terkini.
- **Manajemen Peminjaman**:
  - Pencatatan peminjaman baru.
  - Proses pengembalian barang.
  - Riwayat transaksi lengkap.
- **Manajemen Master Data**:
  - **Data Barang**: Tambah, edit, hapus, dan kelola stok barang.
  - **Data Ruangan**: Manajemen daftar ruangan.
  - **Data Peminjam**: Database guru dan siswa.
- **Import & Export Excel**: Kemudahan migrasi data menggunakan format Excel (.xlsx) untuk Barang, Ruangan, dan Peminjam.
- **Mode Gelap (Dark Mode)**: Antarmuka yang nyaman di mata dengan dukungan tema gelap.
- **Offline First**: Data tersimpan secara lokal (LocalStorage), tidak memerlukan koneksi internet konstan.

## 🛠️ Teknologi yang Digunakan

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Data Processing**: [SheetJS (xlsx)](https://sheetjs.com/)

## 💻 Cara Menjalankan (Development)

Pastikan Anda telah menginstall [Node.js](https://nodejs.org/) di komputer Anda.

1.  **Clone Repository**

    ```bash
    git clone https://github.com/Andndre/sip-sarpras-smpn1seririt.git
    cd sip-sarpras-smpn1seririt
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Jalankan Mode Pengembangan**

    Untuk menjalankan versi Web (di browser):

    ```bash
    npm run dev
    ```

    Untuk menjalankan versi Desktop (Electron):

    ```bash
    npm run electron:dev
    ```

## 📦 Cara Build (Membuat Installer)

Aplikasi ini dapat di-build untuk **Linux** (.AppImage) dan **Windows** (.exe).

### 🐧 Build di Linux (Ubuntu/Kubuntu)

1.  **Install Wine** (Wajib jika ingin membuat file .exe Windows di Linux)

    ```bash
    sudo apt update
    sudo apt install wine
    ```

2.  **Jalankan Perintah Build**
    ```bash
    npm run electron:build
    ```

### 🪟 Build di Windows (Windows 10/11)

1.  **Install Node.js**
    Pastikan Node.js sudah terinstall.

2.  **Install Dependencies**
    Buka CMD/PowerShell di folder proyek:

    ```bash
    npm install
    ```

3.  **Jalankan Perintah Build**
    ```bash
    npm run electron:build
    ```

### 📦 Hasil Build

File installer akan tersedia di folder `release/`:

- `release/*.AppImage` (Linux)
- `release/*.exe` (Windows)

## 📂 Struktur Proyek

```
├── electron/           # Source code Main Process Electron
├── src/
│   ├── components/     # Komponen React UI
│   ├── services/       # Logika database (LocalStorage)
│   ├── types.ts        # Definisi tipe TypeScript
│   ├── App.tsx         # Komponen utama
│   └── main.tsx        # Entry point React
├── public/             # Aset statis (logo, dll)
├── release/            # Hasil build aplikasi
├── package.json        # Konfigurasi project & dependencies
└── vite.config.ts      # Konfigurasi Vite
```

## 📄 Lisensi

Project ini dilisensikan di bawah lisensi **MIT**.

## 👥 Author

**SMPN 1 Seririt**

- Email: admin@smpn1seririt.sch.id
- Website: [https://smpn1seririt.sch.id](https://smpn1seririt.sch.id)
