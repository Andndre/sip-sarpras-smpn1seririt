import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { dbService } from "../services/databaseService";
import { useAlert } from "./AlertModal";
import {
  TransaksiPeminjaman,
  DetailTransaksi,
  KondisiBarang,
  StatusTransaksi,
  Peminjam,
  Barang,
  Ruangan,
} from "../types";
import {
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface PengembalianProps {
  onSuccess: () => void;
}

const Pengembalian: React.FC<PengembalianProps> = ({ onSuccess }) => {
  const { showAlert } = useAlert();
  const [activeTrans, setActiveTrans] = useState<TransaksiPeminjaman[]>([]);
  const [peminjamMap, setPeminjamMap] = useState<Record<number, Peminjam>>({});

  // Modal State
  const [selectedTrans, setSelectedTrans] = useState<number | null>(null);
  const [infoTransId, setInfoTransId] = useState<number | null>(null);
  const [details, setDetails] = useState<DetailTransaksi[]>([]);
  const [itemsMap, setItemsMap] = useState<
    Record<
      string,
      { name: string; code?: string; condition?: string; description?: string }
    >
  >({}); // id -> details

  // Return Form State
  const [returnConditions, setReturnConditions] = useState<
    Record<number, string>
  >({});
  const [returnNotes, setReturnNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allTrans = dbService.getTransaksi();
    const active = allTrans.filter(
      (t) => t.status_transaksi === StatusTransaksi.DIPINJAM
    );
    setActiveTrans(active);

    const peminjam = dbService.getPeminjam();
    const pMap: Record<number, Peminjam> = {};
    peminjam.forEach((p) => (pMap[p.id_peminjam] = p));
    setPeminjamMap(pMap);
  };

  const handleOpenReturn = (transId: number) => {
    const transDetails = dbService.getDetailTransaksi(transId);
    setDetails(transDetails);

    // Load item names
    const barang = dbService.getBarang();
    const ruangan = dbService.getRuangan();
    const iMap: Record<
      string,
      { name: string; code?: string; condition?: string; description?: string }
    > = {};

    transDetails.forEach((d) => {
      if (d.id_barang) {
        const b = barang.find((x) => x.id_barang === d.id_barang);
        if (b) {
          iMap[`b_${d.id_barang}`] = {
            name: b.nama_barang,
            code: b.kode_barang,
            condition: b.kondisi,
            description: b.deskripsi,
          };
          // Pre-fill note with current description
          setReturnNotes((prev) => ({
            ...prev,
            [d.id_detail]: b.deskripsi || "",
          }));
        }
        // Init condition
        setReturnConditions((prev) => ({
          ...prev,
          [d.id_detail]: d.kondisi_sebelum || KondisiBarang.BAIK,
        }));
      } else if (d.id_ruangan) {
        const r = ruangan.find((x) => x.id_ruangan === d.id_ruangan);
        if (r) iMap[`r_${d.id_ruangan}`] = { name: r.nama_ruangan };
      }
    });

    setItemsMap(iMap);
    setSelectedTrans(transId);
  };

  const handleViewInfo = (transId: number) => {
    const transDetails = dbService.getDetailTransaksi(transId);
    setDetails(transDetails);

    // Load item names
    const barang = dbService.getBarang();
    const ruangan = dbService.getRuangan();
    const iMap: Record<
      string,
      { name: string; code?: string; condition?: string; description?: string }
    > = {};

    transDetails.forEach((d) => {
      if (d.id_barang) {
        const b = barang.find((x) => x.id_barang === d.id_barang);
        if (b)
          iMap[`b_${d.id_barang}`] = {
            name: b.nama_barang,
            code: b.kode_barang,
            condition: b.kondisi,
            description: b.deskripsi,
          };
      } else if (d.id_ruangan) {
        const r = ruangan.find((x) => x.id_ruangan === d.id_ruangan);
        if (r) iMap[`r_${d.id_ruangan}`] = { name: r.nama_ruangan };
      }
    });

    setItemsMap(iMap);
    setInfoTransId(transId);
  };

  const handleConditionChange = (detailId: number, condition: string) => {
    setReturnConditions((prev) => ({ ...prev, [detailId]: condition }));
  };

  const handleNoteChange = (detailId: number, note: string) => {
    setReturnNotes((prev) => ({ ...prev, [detailId]: note }));
  };

  const handleSubmitReturn = () => {
    if (!selectedTrans) return;

    // Validate: If condition is damaged, note is required
    for (const d of details) {
      if (d.id_barang) {
        const cond = returnConditions[d.id_detail];
        const note = returnNotes[d.id_detail];
        if (
          (cond === KondisiBarang.RUSAK_RINGAN ||
            cond === KondisiBarang.RUSAK_BERAT) &&
          !note
        ) {
          showAlert(
            "Perhatian",
            "Keterangan wajib diisi untuk barang rusak!",
            "warning"
          );
          return;
        }
      }
    }

    const returns = details.map((d) => ({
      detailId: d.id_detail,
      kondisiSesudah: d.id_barang ? returnConditions[d.id_detail] : "OK", // Ruangan always OK
      keterangan: returnNotes[d.id_detail] || "-",
    }));

    dbService.completeTransaksi(selectedTrans, returns);

    showAlert(
      "Berhasil",
      "Pengembalian berhasil diproses!",
      "success",
      onSuccess
    );
    setSelectedTrans(null);
    loadData(); // Refresh list
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Daftar Peminjaman Aktif
        </h2>

        {activeTrans.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
            <p>Tidak ada peminjaman aktif saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-medium">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Peminjam</th>
                  <th className="px-6 py-3">Tgl Pinjam</th>
                  <th className="px-6 py-3">Rencana Kembali</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {activeTrans.map((t) => (
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
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          new Date(t.tanggal_rencana_kembali) < new Date()
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {new Date(t.tanggal_rencana_kembali).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewInfo(t.id_transaksi)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Lihat Detail Barang"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenReturn(t.id_transaksi)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                          Proses Kembali
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {selectedTrans &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Proses Pengembalian #{selectedTrans}
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
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">
                            {d.id_barang
                              ? itemsMap[`b_${d.id_barang}`]?.name
                              : itemsMap[`r_${d.id_ruangan}`]?.name}
                          </h4>
                          {d.id_barang &&
                            itemsMap[`b_${d.id_barang}`]?.code && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                                {itemsMap[`b_${d.id_barang}`]?.code}
                              </span>
                            )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {d.id_barang ? "Barang" : "Ruangan"}
                          </span>
                        </div>
                        {d.id_barang && (
                          <div className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                            Kondisi Awal: {d.kondisi_sebelum}
                          </div>
                        )}
                      </div>

                      {d.id_barang &&
                        itemsMap[`b_${d.id_barang}`]?.description && (
                          <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded border border-slate-200 dark:border-slate-600">
                            <span className="font-semibold">Deskripsi:</span>{" "}
                            {itemsMap[`b_${d.id_barang}`]?.description}
                          </div>
                        )}

                      {d.id_barang ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Kondisi Akhir
                            </label>
                            <select
                              className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                              value={returnConditions[d.id_detail] || ""}
                              onChange={(e) =>
                                handleConditionChange(
                                  d.id_detail,
                                  e.target.value
                                )
                              }
                            >
                              {Object.values(KondisiBarang).map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="animate-fadeIn">
                            <label
                              className={`block text-xs font-medium mb-1 flex items-center gap-1 ${
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_RINGAN ||
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_BERAT
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {returnConditions[d.id_detail] ===
                                KondisiBarang.RUSAK_RINGAN ||
                              returnConditions[d.id_detail] ===
                                KondisiBarang.RUSAK_BERAT ? (
                                <>
                                  <ExclamationTriangleIcon className="w-3 h-3" />
                                  Keterangan Kerusakan (Wajib)
                                </>
                              ) : (
                                "Keterangan / Deskripsi Barang (Opsional)"
                              )}
                            </label>
                            <input
                              type="text"
                              className={`w-full p-2 text-sm border rounded-lg focus:ring-2 dark:bg-slate-700 dark:text-white ${
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_RINGAN ||
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_BERAT
                                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                                  : "border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                              }`}
                              placeholder={
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_RINGAN ||
                                returnConditions[d.id_detail] ===
                                  KondisiBarang.RUSAK_BERAT
                                  ? "Jelaskan kerusakan..."
                                  : "Deskripsi kondisi barang..."
                              }
                              value={returnNotes[d.id_detail] || ""}
                              onChange={(e) =>
                                handleNoteChange(d.id_detail, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800/50">
                          <CheckCircleIcon className="w-4 h-4" />
                          Ruangan otomatis ditandai selesai
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTrans(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReturn}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm hover:shadow transition-all flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Simpan & Selesai
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Info Modal */}
      {infoTransId &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Detail Peminjaman #{infoTransId}
                </h3>
                <button
                  onClick={() => setInfoTransId(null)}
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
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">
                            {d.id_barang
                              ? itemsMap[`b_${d.id_barang}`]?.name
                              : itemsMap[`r_${d.id_ruangan}`]?.name}
                          </h4>
                          {d.id_barang &&
                            itemsMap[`b_${d.id_barang}`]?.code && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                                {itemsMap[`b_${d.id_barang}`]?.code}
                              </span>
                            )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 block">
                            {d.id_barang ? "Barang" : "Ruangan"}
                          </span>
                        </div>
                        {d.id_barang && (
                          <div className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                            Kondisi Awal: {d.kondisi_sebelum}
                          </div>
                        )}
                      </div>
                      {d.id_barang && itemsMap[`b_${d.id_barang}`] && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">
                              Kondisi Saat Ini
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {itemsMap[`b_${d.id_barang}`]?.condition || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">
                              Deskripsi
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {itemsMap[`b_${d.id_barang}`]?.description || "-"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setInfoTransId(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Pengembalian;
