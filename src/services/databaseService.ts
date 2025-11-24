import {
  Barang,
  Ruangan,
  Peminjam,
  TransaksiPeminjaman,
  DetailTransaksi,
  KondisiBarang,
  StatusBarang,
  StatusRuangan,
  TipePeminjam,
  StatusTransaksi,
  DashboardStats,
} from "../types";

// Keys for LocalStorage
const KEYS = {
  BARANG: "db_barang",
  RUANGAN: "db_ruangan",
  PEMINJAM: "db_peminjam",
  TRANSAKSI: "db_transaksi",
  DETAIL_TRANSAKSI: "db_detail_transaksi",
};

// Initial Seed Data
const SEED_BARANG: Barang[] = [];

const SEED_RUANGAN: Ruangan[] = [];

const SEED_PEMINJAM: Peminjam[] = [];

class DatabaseService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(KEYS.BARANG)) {
      localStorage.setItem(KEYS.BARANG, JSON.stringify(SEED_BARANG));
    }
    if (!localStorage.getItem(KEYS.RUANGAN)) {
      localStorage.setItem(KEYS.RUANGAN, JSON.stringify(SEED_RUANGAN));
    }
    if (!localStorage.getItem(KEYS.PEMINJAM)) {
      localStorage.setItem(KEYS.PEMINJAM, JSON.stringify(SEED_PEMINJAM));
    }
    if (!localStorage.getItem(KEYS.TRANSAKSI)) {
      localStorage.setItem(KEYS.TRANSAKSI, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.DETAIL_TRANSAKSI)) {
      localStorage.setItem(KEYS.DETAIL_TRANSAKSI, JSON.stringify([]));
    }
  }

  // --- Generic Helpers ---
  private getTable<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setTable<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(table: any[], idField: string): number {
    if (table.length === 0) return 1;
    return Math.max(...table.map((item: any) => item[idField] as number)) + 1;
  }

  // --- Master Data Getters ---
  getBarang(): Barang[] {
    return this.getTable<Barang>(KEYS.BARANG);
  }

  getRuangan(): Ruangan[] {
    return this.getTable<Ruangan>(KEYS.RUANGAN);
  }

  getPeminjam(): Peminjam[] {
    return this.getTable<Peminjam>(KEYS.PEMINJAM);
  }

  getTransaksi(): TransaksiPeminjaman[] {
    // Sort by newest
    return this.getTable<TransaksiPeminjaman>(KEYS.TRANSAKSI).sort(
      (a, b) => b.id_transaksi - a.id_transaksi
    );
  }

  getDetailTransaksi(transaksiId: number): DetailTransaksi[] {
    return this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI).filter(
      (d) => d.id_transaksi === transaksiId
    );
  }

  // --- Master Data Setters ---
  createPeminjam(peminjam: Omit<Peminjam, "id_peminjam">): number {
    const table = this.getTable<Peminjam>(KEYS.PEMINJAM);
    // Check for duplicate nomor_induk
    if (table.some((p) => p.nomor_induk === peminjam.nomor_induk)) {
      throw new Error(
        `Peminjam dengan Nomor Induk ${peminjam.nomor_induk} sudah ada.`
      );
    }

    const newId = this.generateId(table, "id_peminjam");
    const newPeminjam = { ...peminjam, id_peminjam: newId };
    table.push(newPeminjam);
    this.setTable(KEYS.PEMINJAM, table);
    return newId;
  }

  // --- Business Logic: Transaksi Baru ---
  createTransaksi(
    peminjamId: number,
    tanggalRencanaKembali: string,
    items: { type: "BARANG" | "RUANGAN"; id: number }[]
  ): void {
    const transTable = this.getTransaksi();
    const detailTable = this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI);
    const barangTable = this.getBarang();
    const ruanganTable = this.getRuangan();

    const newTransId = this.generateId(transTable, "id_transaksi");
    const now = new Date().toISOString();

    // 1. Create Header
    const newTrans: TransaksiPeminjaman = {
      id_transaksi: newTransId,
      id_peminjam: peminjamId,
      tanggal_pinjam: now,
      tanggal_rencana_kembali: tanggalRencanaKembali,
      status_transaksi: StatusTransaksi.DIPINJAM,
      tanggal_kembali_aktual: null,
    };

    // 2. Create Details & Update Master Status
    items.forEach((item) => {
      let detail: DetailTransaksi = {
        id_detail: this.generateId(detailTable, "id_detail"),
        id_transaksi: newTransId,
        kondisi_sebelum: null,
        id_barang: item.type === "BARANG" ? item.id : null,
        id_ruangan: item.type === "RUANGAN" ? item.id : null,
      };

      if (item.type === "BARANG") {
        const barangIdx = barangTable.findIndex((b) => b.id_barang === item.id);
        if (barangIdx >= 0) {
          barangTable[barangIdx].status = StatusBarang.DIPINJAM;
          detail.kondisi_sebelum = barangTable[barangIdx].kondisi;
          // Save Snapshot
          detail.snapshot_nama_barang = barangTable[barangIdx].nama_barang;
          detail.snapshot_kode_barang = barangTable[barangIdx].kode_barang;
        }
      } else {
        const ruanganIdx = ruanganTable.findIndex(
          (r) => r.id_ruangan === item.id
        );
        if (ruanganIdx >= 0) {
          ruanganTable[ruanganIdx].status = StatusRuangan.DIPINJAM;
          // Save Snapshot
          detail.snapshot_nama_ruangan = ruanganTable[ruanganIdx].nama_ruangan;
        }
      }
      detailTable.push(detail);
    });

    transTable.push(newTrans);

    // Commit
    this.setTable(KEYS.TRANSAKSI, transTable);
    this.setTable(KEYS.DETAIL_TRANSAKSI, detailTable);
    this.setTable(KEYS.BARANG, barangTable);
    this.setTable(KEYS.RUANGAN, ruanganTable);
  }

  // --- Business Logic: Pengembalian ---
  completeTransaksi(
    transaksiId: number,
    returns: {
      detailId: number;
      kondisiSesudah: string;
      keterangan: string;
    }[]
  ): void {
    const transTable = this.getTransaksi();
    const detailTable = this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI);
    const barangTable = this.getBarang();
    const ruanganTable = this.getRuangan();

    const transIdx = transTable.findIndex(
      (t) => t.id_transaksi === transaksiId
    );
    if (transIdx === -1) return;

    // 1. Update Header
    transTable[transIdx].status_transaksi = StatusTransaksi.SELESAI;
    transTable[transIdx].tanggal_kembali_aktual = new Date().toISOString();

    // 2. Update Details & Master Status
    returns.forEach((ret) => {
      const detailIdx = detailTable.findIndex(
        (d) => d.id_detail === ret.detailId
      );
      if (detailIdx >= 0) {
        const detail = detailTable[detailIdx];

        // Update Detail
        detailTable[detailIdx].kondisi_sesudah = ret.kondisiSesudah;
        detailTable[detailIdx].keterangan = ret.keterangan;

        // Restore Master Status
        if (detail.id_barang) {
          const bIdx = barangTable.findIndex(
            (b) => b.id_barang === detail.id_barang
          );
          if (bIdx >= 0) {
            barangTable[bIdx].status = StatusBarang.TERSEDIA;
            // Update condition if changed
            if (ret.kondisiSesudah) {
              barangTable[bIdx].kondisi = ret.kondisiSesudah as KondisiBarang;
            }
            // Update description with the return note (keterangan)
            if (ret.keterangan && ret.keterangan !== "-") {
              barangTable[bIdx].deskripsi = ret.keterangan;
            }
          }
        } else if (detail.id_ruangan) {
          const rIdx = ruanganTable.findIndex(
            (r) => r.id_ruangan === detail.id_ruangan
          );
          if (rIdx >= 0) {
            ruanganTable[rIdx].status = StatusRuangan.TERSEDIA;
          }
        }
      }
    });

    // Commit
    this.setTable(KEYS.TRANSAKSI, transTable);
    this.setTable(KEYS.DETAIL_TRANSAKSI, detailTable);
    this.setTable(KEYS.BARANG, barangTable);
    this.setTable(KEYS.RUANGAN, ruanganTable);
  }

  // --- Statistics ---
  getStats(): DashboardStats {
    const barang = this.getBarang();
    const ruangan = this.getRuangan();
    const transaksi = this.getTransaksi();

    return {
      totalBarang: barang.length,
      barangTersedia: barang.filter((b) => b.status === StatusBarang.TERSEDIA)
        .length,
      totalRuangan: ruangan.length,
      ruanganTersedia: ruangan.filter(
        (r) => r.status === StatusRuangan.TERSEDIA
      ).length,
      transaksiAktif: transaksi.filter(
        (t) => t.status_transaksi === StatusTransaksi.DIPINJAM
      ).length,
    };
  }

  // --- Master Data CRUD: Barang ---
  createBarang(barang: Omit<Barang, "id_barang">): number {
    const table = this.getTable<Barang>(KEYS.BARANG);
    if (table.some((b) => b.kode_barang === barang.kode_barang)) {
      throw new Error(`Barang dengan Kode ${barang.kode_barang} sudah ada.`);
    }
    const newId = this.generateId(table, "id_barang");
    table.push({ ...barang, id_barang: newId });
    this.setTable(KEYS.BARANG, table);
    return newId;
  }

  updateBarang(id: number, updates: Partial<Barang>): void {
    const table = this.getTable<Barang>(KEYS.BARANG);
    const idx = table.findIndex((b) => b.id_barang === id);
    if (idx === -1) throw new Error("Barang tidak ditemukan");

    // Check duplicate code if changing code
    if (updates.kode_barang && updates.kode_barang !== table[idx].kode_barang) {
      if (table.some((b) => b.kode_barang === updates.kode_barang)) {
        throw new Error(`Barang dengan Kode ${updates.kode_barang} sudah ada.`);
      }
    }

    table[idx] = { ...table[idx], ...updates };
    this.setTable(KEYS.BARANG, table);
  }

  deleteBarang(id: number): void {
    const table = this.getTable<Barang>(KEYS.BARANG);
    // Check if used in transactions (optional but good practice)
    // For now just delete
    const newTable = table.filter((b) => b.id_barang !== id);
    this.setTable(KEYS.BARANG, newTable);
  }

  // --- Master Data CRUD: Ruangan ---
  createRuangan(ruangan: Omit<Ruangan, "id_ruangan">): number {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const newId = this.generateId(table, "id_ruangan");
    table.push({ ...ruangan, id_ruangan: newId });
    this.setTable(KEYS.RUANGAN, table);
    return newId;
  }

  updateRuangan(id: number, updates: Partial<Ruangan>): void {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const idx = table.findIndex((r) => r.id_ruangan === id);
    if (idx === -1) throw new Error("Ruangan tidak ditemukan");
    table[idx] = { ...table[idx], ...updates };
    this.setTable(KEYS.RUANGAN, table);
  }

  deleteRuangan(id: number): void {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const newTable = table.filter((r) => r.id_ruangan !== id);
    this.setTable(KEYS.RUANGAN, newTable);
  }

  // --- Master Data CRUD: Peminjam (Update/Delete) ---
  updatePeminjam(id: number, updates: Partial<Peminjam>): void {
    const table = this.getTable<Peminjam>(KEYS.PEMINJAM);
    const idx = table.findIndex((p) => p.id_peminjam === id);
    if (idx === -1) throw new Error("Peminjam tidak ditemukan");

    if (updates.nomor_induk && updates.nomor_induk !== table[idx].nomor_induk) {
      if (table.some((p) => p.nomor_induk === updates.nomor_induk)) {
        throw new Error(
          `Peminjam dengan Nomor Induk ${updates.nomor_induk} sudah ada.`
        );
      }
    }

    table[idx] = { ...table[idx], ...updates };
    this.setTable(KEYS.PEMINJAM, table);
  }

  deletePeminjam(id: number): void {
    const table = this.getTable<Peminjam>(KEYS.PEMINJAM);
    const newTable = table.filter((p) => p.id_peminjam !== id);
    this.setTable(KEYS.PEMINJAM, newTable);
  }

  // --- Import History ---
  importHistoryTransaction(
    peminjamId: number,
    tanggalPinjam: string,
    tanggalKembali: string, // Rencana
    tanggalKembaliAktual: string,
    items: {
      type: "BARANG" | "RUANGAN";
      id: number;
      kondisiSebelum: string;
      kondisiSesudah: string;
      keterangan: string;
      snapshotNama?: string;
      snapshotKode?: string;
    }[]
  ): void {
    const transTable = this.getTransaksi();
    const detailTable = this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI);

    // Generate new ID
    const newTransId = this.generateId(transTable, "id_transaksi");

    // 1. Create Header
    const newTrans: TransaksiPeminjaman = {
      id_transaksi: newTransId,
      id_peminjam: peminjamId,
      tanggal_pinjam: tanggalPinjam,
      tanggal_rencana_kembali: tanggalKembali,
      status_transaksi: StatusTransaksi.SELESAI,
      tanggal_kembali_aktual: tanggalKembaliAktual,
    };

    // 2. Create Details (No Master Data Update for History Import)
    items.forEach((item) => {
      const detail: DetailTransaksi = {
        id_detail: this.generateId(detailTable, "id_detail"),
        id_transaksi: newTransId,
        kondisi_sebelum: item.kondisiSebelum,
        kondisi_sesudah: item.kondisiSesudah,
        keterangan: item.keterangan,
        id_barang: item.type === "BARANG" ? item.id : null,
        id_ruangan: item.type === "RUANGAN" ? item.id : null,
      };

      if (item.type === "BARANG") {
        detail.snapshot_nama_barang = item.snapshotNama;
        detail.snapshot_kode_barang = item.snapshotKode;
      } else {
        detail.snapshot_nama_ruangan = item.snapshotNama;
      }

      detailTable.push(detail);
    });

    transTable.push(newTrans);

    // Commit
    this.setTable(KEYS.TRANSAKSI, transTable);
    this.setTable(KEYS.DETAIL_TRANSAKSI, detailTable);
  }
}

export const dbService = new DatabaseService();
