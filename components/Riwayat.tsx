import React, { useState, useEffect } from "react";
import { dbService } from "../services/databaseService";
import {
  TransaksiPeminjaman,
  StatusTransaksi,
  Peminjam,
  DetailTransaksi,
} from "../types";
import { ClockIcon, EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const Riwayat: React.FC = () => {
  const [historyTrans, setHistoryTrans] = useState<TransaksiPeminjaman[]>([]);
  const [peminjamMap, setPeminjamMap] = useState<Record<number, Peminjam>>({});

  // Modal State
  const [selectedTrans, setSelectedTrans] = useState<number | null>(null);
  const [details, setDetails] = useState<DetailTransaksi[]>([]);
  const [itemsMap, setItemsMap] = useState<
    Record<string, { name: string; code?: string }>
  >({}); // id -> {name, code}

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

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-slate-500" />
        Riwayat Peminjaman Selesai
      </h2>

      {historyTrans.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p>Belum ada riwayat peminjaman.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-medium">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Peminjam</th>
                <th className="px-6 py-3">Tgl Pinjam</th>
                <th className="px-6 py-3">Tgl Kembali</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyTrans.map((t) => (
                <tr key={t.id_transaksi} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    #{t.id_transaksi}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">
                      {peminjamMap[t.id_peminjam]?.nama_peminjam}
                    </div>
                    <div className="text-xs text-slate-500">
                      {peminjamMap[t.id_peminjam]?.nomor_induk}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(t.tanggal_pinjam).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    {t.tanggal_kembali_aktual
                      ? new Date(t.tanggal_kembali_aktual).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      Selesai
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(t.id_transaksi)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                Detail Transaksi #{selectedTrans}
              </h3>
              <button
                onClick={() => setSelectedTrans(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {details.map((d) => (
                  <div
                    key={d.id_detail}
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {d.id_barang
                            ? itemsMap[`b_${d.id_barang}`]?.name
                            : itemsMap[`r_${d.id_ruangan}`]?.name}
                        </h4>
                        {d.id_barang && itemsMap[`b_${d.id_barang}`]?.code && (
                          <span className="text-xs text-slate-500 block font-mono mt-0.5">
                            {itemsMap[`b_${d.id_barang}`]?.code}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 uppercase tracking-wider mt-1 block">
                          {d.id_barang ? "Barang" : "Ruangan"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="block text-xs text-slate-500 mb-1">
                          Kondisi Awal
                        </span>
                        <span className="font-medium text-slate-700">
                          {d.kondisi_sebelum || "-"}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="block text-xs text-slate-500 mb-1">
                          Kondisi Akhir
                        </span>
                        <span className="font-medium text-slate-700">
                          {d.kondisi_sesudah || "-"}
                        </span>
                      </div>
                    </div>

                    {d.keterangan && d.keterangan !== "-" && (
                      <div className="mt-3 text-sm bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-100">
                        <span className="font-semibold block text-xs mb-1 text-yellow-600">
                          Catatan / Keterangan:
                        </span>
                        {d.keterangan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedTrans(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Riwayat;
