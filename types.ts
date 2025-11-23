// Enums based on database constraints
export enum KondisiBarang {
  BAIK = 'Baik',
  RUSAK_RINGAN = 'Rusak Ringan',
  RUSAK_BERAT = 'Rusak Berat',
}

export enum StatusBarang {
  TERSEDIA = 'Tersedia',
  DIPINJAM = 'Dipinjam',
}

export enum StatusRuangan {
  TERSEDIA = 'Tersedia',
  DIPINJAM = 'Dipinjam',
}

export enum TipePeminjam {
  GURU = 'Guru',
  SISWA = 'Siswa',
}

export enum StatusTransaksi {
  DIPINJAM = 'Dipinjam',
  SELESAI = 'Selesai',
}

// Models matching the SQL Tables

export interface Barang {
  id_barang: number; // PK
  nama_barang: string;
  kode_barang: string; // UNIQUE
  kondisi: KondisiBarang;
  deskripsi: string;
  status: StatusBarang;
}

export interface Ruangan {
  id_ruangan: number; // PK
  nama_ruangan: string;
  status: StatusRuangan;
}

export interface Peminjam {
  id_peminjam: number; // PK
  nama_peminjam: string;
  tipe_peminjam: TipePeminjam;
  nomor_induk: string; // UNIQUE (NIP/NISN)
}

export interface TransaksiPeminjaman {
  id_transaksi: number; // PK
  id_peminjam: number; // FK
  tanggal_pinjam: string; // ISO8601
  tanggal_rencana_kembali: string; // ISO8601
  tanggal_kembali_aktual?: string | null; // ISO8601 Nullable
  status_transaksi: StatusTransaksi;
}

export interface DetailTransaksi {
  id_detail: number; // PK
  id_transaksi: number; // FK
  id_barang?: number | null; // FK Nullable
  id_ruangan?: number | null; // FK Nullable
  kondisi_sebelum: string | null; // Snapshot of condition
  kondisi_sesudah?: string | null;
  keterangan?: string | null;
}

// Helper types for UI
export type ViewState = 'DASHBOARD' | 'TRANSAKSI_BARU' | 'PENGEMBALIAN' | 'RIWAYAT' | 'DATA_BARANG' | 'DATA_RUANGAN' | 'DATA_PEMINJAM';

export interface DashboardStats {
  totalBarang: number;
  barangTersedia: number;
  totalRuangan: number;
  ruanganTersedia: number;
  transaksiAktif: number;
}