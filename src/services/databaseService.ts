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
  DB_VERSION: "db_version",
};

// Initial Seed Data
const SEED_BARANG: Barang[] = [];

const SEED_RUANGAN: Ruangan[] = [];

const SEED_PEMINJAM: Peminjam[] = [];

class DatabaseService {
  constructor() {
    this.init();
    this.runMigrations();
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

  private runMigrations() {
    const currentVersion = parseInt(
      localStorage.getItem(KEYS.DB_VERSION) || "0",
      10
    );
    const LATEST_VERSION = 2;

    if (currentVersion >= LATEST_VERSION) return;

    console.log(
      `Current DB Version: ${currentVersion}. Migrating to ${LATEST_VERSION}...`
    );

    if (currentVersion < 1) {
      this.migrateV1_GuruFix();
    }

    if (currentVersion < 2) {
      this.migrateToUUID();
    }

    localStorage.setItem(KEYS.DB_VERSION, LATEST_VERSION.toString());
    console.log(`Migration finished. DB Version is now ${LATEST_VERSION}.`);
  }

  private migrateV1_GuruFix() {
    // Migration: Update 'Guru' to 'Guru/GTK'
    const peminjamTable = this.getTable<any>(KEYS.PEMINJAM);
    let changed = false;
    const updatedPeminjam = peminjamTable.map((p) => {
      // Check for old value "Guru"
      if ((p.tipe_peminjam as string) === "Guru") {
        changed = true;
        return { ...p, tipe_peminjam: TipePeminjam.GURU };
      }
      return p;
    });

    if (changed) {
      this.setTable(KEYS.PEMINJAM, updatedPeminjam);
      console.log("Migrated Peminjam data: 'Guru' -> 'Guru/GTK'");
    }
  }

  private migrateToUUID() {
    // Check if migration is needed by checking if IDs are numbers in any table
    const barang = this.getTable<any>(KEYS.BARANG);
    const ruangan = this.getTable<any>(KEYS.RUANGAN);
    const peminjam = this.getTable<any>(KEYS.PEMINJAM);
    const transaksi = this.getTable<any>(KEYS.TRANSAKSI);
    const details = this.getTable<any>(KEYS.DETAIL_TRANSAKSI);

    const isNumberId = (list: any[], key: string) =>
      list.length > 0 && typeof list[0][key] === "number";

    if (
      isNumberId(barang, "id_barang") ||
      isNumberId(ruangan, "id_ruangan") ||
      isNumberId(peminjam, "id_peminjam") ||
      isNumberId(transaksi, "id_transaksi")
    ) {
      console.log("Starting migration to UUIDs...");

      // Maps to store Old ID -> New UUID
      const barangMap: Record<number, string> = {};
      const ruanganMap: Record<number, string> = {};
      const peminjamMap: Record<number, string> = {};
      const transMap: Record<number, string> = {};

      // 1. Migrate Barang
      const newBarang = barang.map((b) => {
        if (typeof b.id_barang === "number") {
          const newId = crypto.randomUUID();
          barangMap[b.id_barang] = newId;
          return { ...b, id_barang: newId };
        }
        return b;
      });
      this.setTable(KEYS.BARANG, newBarang);

      // 2. Migrate Ruangan
      const newRuangan = ruangan.map((r) => {
        if (typeof r.id_ruangan === "number") {
          const newId = crypto.randomUUID();
          ruanganMap[r.id_ruangan] = newId;
          return { ...r, id_ruangan: newId };
        }
        return r;
      });
      this.setTable(KEYS.RUANGAN, newRuangan);

      // 3. Migrate Peminjam
      const newPeminjam = peminjam.map((p) => {
        if (typeof p.id_peminjam === "number") {
          const newId = crypto.randomUUID();
          peminjamMap[p.id_peminjam] = newId;
          return { ...p, id_peminjam: newId };
        }
        return p;
      });
      this.setTable(KEYS.PEMINJAM, newPeminjam);

      // 4. Migrate Transaksi
      const newTransaksi = transaksi.map((t) => {
        let newId = t.id_transaksi;
        let newPeminjamId = t.id_peminjam;

        if (typeof t.id_transaksi === "number") {
          // Use existing UUID if available (from previous migration), otherwise generate new
          newId = t.uuid || crypto.randomUUID();
          transMap[t.id_transaksi] = newId;
        }

        if (typeof t.id_peminjam === "number") {
          newPeminjamId = peminjamMap[t.id_peminjam] || t.id_peminjam;
        }

        // Remove uuid field
        const { uuid, ...rest } = t;

        return {
          ...rest,
          id_transaksi: newId,
          id_peminjam: newPeminjamId,
        };
      });
      this.setTable(KEYS.TRANSAKSI, newTransaksi);

      // 5. Migrate Detail Transaksi
      const newDetails = details.map((d) => {
        let newId = d.id_detail;
        let newTransId = d.id_transaksi;
        let newBarangId = d.id_barang;
        let newRuanganId = d.id_ruangan;

        if (typeof d.id_detail === "number" || d.id_detail === undefined) {
          newId = crypto.randomUUID();
        }

        if (typeof d.id_transaksi === "number") {
          newTransId = transMap[d.id_transaksi] || d.id_transaksi;
        }

        if (d.id_barang && typeof d.id_barang === "number") {
          newBarangId = barangMap[d.id_barang] || d.id_barang;
        }

        if (d.id_ruangan && typeof d.id_ruangan === "number") {
          newRuanganId = ruanganMap[d.id_ruangan] || d.id_ruangan;
        }

        return {
          ...d,
          id_detail: newId,
          id_transaksi: newTransId,
          id_barang: newBarangId,
          id_ruangan: newRuanganId,
        };
      });
      this.setTable(KEYS.DETAIL_TRANSAKSI, newDetails);

      console.log("Migration to UUIDs completed successfully.");
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

  // Removed generateId as we use crypto.randomUUID() now

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
    // Sort by newest (using tanggal_pinjam since UUIDs are not sortable)
    return this.getTable<TransaksiPeminjaman>(KEYS.TRANSAKSI).sort(
      (a, b) =>
        new Date(b.tanggal_pinjam).getTime() -
        new Date(a.tanggal_pinjam).getTime()
    );
  }

  getDetailTransaksi(transaksiId: string): DetailTransaksi[] {
    return this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI).filter(
      (d) => d.id_transaksi === transaksiId
    );
  }

  // --- Master Data Setters ---
  createPeminjam(peminjam: Omit<Peminjam, "id_peminjam">): string {
    const table = this.getTable<Peminjam>(KEYS.PEMINJAM);
    // Check for duplicate nomor_induk
    if (table.some((p) => p.nomor_induk === peminjam.nomor_induk)) {
      throw new Error(
        `Peminjam dengan Nomor Induk ${peminjam.nomor_induk} sudah ada.`
      );
    }

    const newId = crypto.randomUUID();
    const newPeminjam = { ...peminjam, id_peminjam: newId };
    table.push(newPeminjam);
    this.setTable(KEYS.PEMINJAM, table);
    return newId;
  }

  // --- Business Logic: Transaksi Baru ---
  createTransaksi(
    peminjamId: string,
    tanggalRencanaKembali: string,
    items: { type: "BARANG" | "RUANGAN"; id: string }[]
  ): void {
    const transTable = this.getTransaksi();
    const detailTable = this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI);
    const barangTable = this.getBarang();
    const ruanganTable = this.getRuangan();

    const newTransId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Create Header
    const newTrans: TransaksiPeminjaman = {
      id_transaksi: newTransId,
      // uuid: crypto.randomUUID(), // Removed as id_transaksi is now UUID
      id_peminjam: peminjamId,
      tanggal_pinjam: now,
      tanggal_rencana_kembali: tanggalRencanaKembali,
      status_transaksi: StatusTransaksi.DIPINJAM,
      tanggal_kembali_aktual: null,
    };

    // 2. Create Details & Update Master Status
    items.forEach((item) => {
      let detail: DetailTransaksi = {
        id_detail: crypto.randomUUID(),
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
    transaksiId: string,
    returns: {
      detailId: string;
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
  createBarang(barang: Omit<Barang, "id_barang">): string {
    const table = this.getTable<Barang>(KEYS.BARANG);
    if (table.some((b) => b.kode_barang === barang.kode_barang)) {
      throw new Error(`Barang dengan Kode ${barang.kode_barang} sudah ada.`);
    }
    const newId = crypto.randomUUID();
    table.push({ ...barang, id_barang: newId });
    this.setTable(KEYS.BARANG, table);
    return newId;
  }

  updateBarang(id: string, updates: Partial<Barang>): void {
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

  deleteBarang(id: string): void {
    const table = this.getTable<Barang>(KEYS.BARANG);
    // Check if used in transactions (optional but good practice)
    // For now just delete
    const newTable = table.filter((b) => b.id_barang !== id);
    this.setTable(KEYS.BARANG, newTable);
  }

  // --- Master Data CRUD: Ruangan ---
  createRuangan(ruangan: Omit<Ruangan, "id_ruangan">): string {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const newId = crypto.randomUUID();
    table.push({ ...ruangan, id_ruangan: newId });
    this.setTable(KEYS.RUANGAN, table);
    return newId;
  }

  updateRuangan(id: string, updates: Partial<Ruangan>): void {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const idx = table.findIndex((r) => r.id_ruangan === id);
    if (idx === -1) throw new Error("Ruangan tidak ditemukan");
    table[idx] = { ...table[idx], ...updates };
    this.setTable(KEYS.RUANGAN, table);
  }

  deleteRuangan(id: string): void {
    const table = this.getTable<Ruangan>(KEYS.RUANGAN);
    const newTable = table.filter((r) => r.id_ruangan !== id);
    this.setTable(KEYS.RUANGAN, newTable);
  }

  // --- Master Data CRUD: Peminjam (Update/Delete) ---
  updatePeminjam(id: string, updates: Partial<Peminjam>): void {
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

  deletePeminjam(id: string): void {
    const table = this.getTable<Peminjam>(KEYS.PEMINJAM);
    const newTable = table.filter((p) => p.id_peminjam !== id);
    this.setTable(KEYS.PEMINJAM, newTable);
  }

  // --- Import History ---
  importHistoryTransaction(
    peminjamId: string,
    tanggalPinjam: string,
    tanggalKembali: string, // Rencana
    tanggalKembaliAktual: string,
    items: {
      type: "BARANG" | "RUANGAN";
      id: string;
      kondisiSebelum: string;
      kondisiSesudah: string;
      keterangan: string;
      snapshotNama?: string;
      snapshotKode?: string;
    }[],
    uuid?: string
  ): boolean {
    const transTable = this.getTransaksi();
    const detailTable = this.getTable<DetailTransaksi>(KEYS.DETAIL_TRANSAKSI);

    // Check for duplicates by UUID if provided
    // Since id_transaksi IS the UUID now, we can check against id_transaksi too if uuid is provided
    // But let's stick to checking if id_transaksi exists if uuid is passed as id_transaksi
    const targetUuid = uuid || crypto.randomUUID();

    if (transTable.some((t) => t.id_transaksi === targetUuid)) {
      console.log(
        `Transaction with UUID ${targetUuid} already exists. Skipping.`
      );
      return false;
    }

    // 1. Create Header
    const newTrans: TransaksiPeminjaman = {
      id_transaksi: targetUuid,
      // uuid: targetUuid, // Removed
      id_peminjam: peminjamId,
      tanggal_pinjam: tanggalPinjam,
      tanggal_rencana_kembali: tanggalKembali,
      status_transaksi: StatusTransaksi.SELESAI,
      tanggal_kembali_aktual: tanggalKembaliAktual,
    };

    // 2. Create Details (No Master Data Update for History Import)
    items.forEach((item) => {
      const detail: DetailTransaksi = {
        id_detail: crypto.randomUUID(),
        id_transaksi: targetUuid,
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
    return true;
  }
}

export const dbService = new DatabaseService();
