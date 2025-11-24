import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../services/databaseService";
import { excelService } from "../services/excelService";
import {
  TransaksiPeminjaman,
  StatusTransaksi,
  Peminjam,
  DetailTransaksi,
} from "../types";
import {
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

const Riwayat: React.FC = () => {
  const [historyTrans, setHistoryTrans] = useState<TransaksiPeminjaman[]>([]);
  const [peminjamMap, setPeminjamMap] = useState<Record<number, Peminjam>>({});

  // Filter State
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Modal State
  const [selectedTrans, setSelectedTrans] = useState<number | null>(null);
  const [details, setDetails] = useState<DetailTransaksi[]>([]);
  const [itemsMap, setItemsMap] = useState<
    Record<string, { name: string; code?: string }>
  >({}); // id -> {name, code}

  // Import/Export State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allTrans = dbService.getTransaksi();
    const history = allTrans.filter(
      (t) => t.status_transaksi === StatusTransaksi.SELESAI
    );
    setHistoryTrans(history);

    const peminjam = dbService.getPeminjam();
    const pMap: Record<number, Peminjam> = {};
    peminjam.forEach((p) => (pMap[p.id_peminjam] = p));
    setPeminjamMap(pMap);
  }, []);

  const handleViewDetails = (transId: number) => {
    const transDetails = dbService.getDetailTransaksi(transId);
    setDetails(transDetails);

    // Load item names
    const barang = dbService.getBarang();
    const ruangan = dbService.getRuangan();
    const iMap: Record<string, { name: string; code?: string }> = {};

    transDetails.forEach((d) => {
      if (d.id_barang) {
        const b = barang.find((x) => x.id_barang === d.id_barang);
        if (b)
          iMap[`b_${d.id_barang}`] = {
            name: b.nama_barang,
            code: b.kode_barang,
          };
      } else if (d.id_ruangan) {
        const r = ruangan.find((x) => x.id_ruangan === d.id_ruangan);
        if (r) iMap[`r_${d.id_ruangan}`] = { name: r.nama_ruangan };
      }
    });

    setItemsMap(iMap);
    setSelectedTrans(transId);
  };

  const filteredHistory = historyTrans.filter((t) => {
    if (!filterStartDate && !filterEndDate) return true;
    if (filterStartDate && t.tanggal_pinjam < filterStartDate) return false;
    if (filterEndDate && t.tanggal_pinjam > filterEndDate) return false;
    return true;
  });

  const handleExport = () => {
    const dataToExport = historyTrans.map((t) => ({
      ID: t.id_transaksi,
      Peminjam: peminjamMap[t.id_peminjam]?.nama_peminjam || "Unknown",
      "Nomor Induk": peminjamMap[t.id_peminjam]?.nomor_induk || "-",
      "Tanggal Pinjam": new Date(t.tanggal_pinjam).toLocaleDateString("id-ID"),
      "Tanggal Kembali": t.tanggal_kembali_aktual
        ? new Date(t.tanggal_kembali_aktual).toLocaleDateString("id-ID")
        : "-",
      Status: "Selesai",
    }));

    excelService.exportToExcel(dataToExport, "Riwayat_Peminjaman");
  };

  const handleDownloadTemplate = () => {
    const columns = [
      "ID",
      "ID Peminjam",
      "Tanggal Pinjam (YYYY-MM-DD)",
      "Tanggal Kembali (YYYY-MM-DD)",
    ];
    excelService.downloadTemplate(columns, "Template_Riwayat");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await excelService.readExcel(file);
      // Note: This is a simplified import. In a real app, you'd need to validate IDs,
      // check for duplicates, and handle the details (items) which are complex to import flat.
      // For now, we'll just alert that this feature is limited or just log it.
      console.log("Imported data:", data);
      alert(
        "Fitur Import Riwayat saat ini hanya membaca data (lihat console). Implementasi penuh memerlukan penanganan relasi data yang kompleks."
      );
      setIsImportModalOpen(false);
    } catch (error) {
      console.error("Error importing:", error);
      alert("Gagal mengimport data.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ClockIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          Riwayat Peminjaman Selesai
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-end bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(filterStartDate || filterEndDate) && (
          <button
            onClick={() => {
              setFilterStartDate("");
              setFilterEndDate("");
            }}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
          <p>Belum ada riwayat peminjaman.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-medium">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Peminjam</th>
                <th className="px-6 py-3">Tgl Pinjam</th>
                <th className="px-6 py-3">Tgl Kembali</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredHistory.map((t) => (
                <tr
                  key={t.id_transaksi}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    #{t.id_transaksi}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {peminjamMap[t.id_peminjam]?.nama_peminjam}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {peminjamMap[t.id_peminjam]?.nomor_induk}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {new Date(t.tanggal_pinjam).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {t.tanggal_kembali_aktual
                      ? new Date(t.tanggal_kembali_aktual).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                      Selesai
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(t.id_transaksi)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTrans && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Detail Transaksi #{selectedTrans}
              </h3>
              <button
                onClick={() => setSelectedTrans(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {details.map((d) => (
                  <div
                    key={d.id_detail}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">
                          {d.id_barang
                            ? itemsMap[`b_${d.id_barang}`]?.name
                            : itemsMap[`r_${d.id_ruangan}`]?.name}
                        </h4>
                        {d.id_barang && itemsMap[`b_${d.id_barang}`]?.code && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                            {itemsMap[`b_${d.id_barang}`]?.code}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 block">
                          {d.id_barang ? "Barang" : "Ruangan"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Kondisi Awal
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {d.kondisi_sebelum || "-"}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Kondisi Akhir
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {d.kondisi_sesudah || "-"}
                        </span>
                      </div>
                    </div>

                    {d.keterangan && d.keterangan !== "-" && (
                      <div className="mt-3 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded border border-yellow-100 dark:border-yellow-800/50">
                        <span className="font-semibold block text-xs mb-1 text-yellow-600 dark:text-yellow-400">
                          Catatan / Keterangan:
                        </span>
                        {d.keterangan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedTrans(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Import Riwayat
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Gunakan template yang telah disediakan untuk memastikan format
                  data benar.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Download Template Excel
                </button>
              </div>

              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  className="hidden"
                  accept=".xlsx, .xls"
                />
                <ArrowDownTrayIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Klik untuk upload file Excel
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Format: .xlsx, .xls
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Riwayat;
