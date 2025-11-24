import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../services/databaseService";
import { excelService } from "../services/excelService";
import { Barang, KondisiBarang, StatusBarang } from "../types";
import { useAlert } from "./AlertModal";
import {
  CubeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

const DataBarang: React.FC = () => {
  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKondisi, setFilterKondisi] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [kondisi, setKondisi] = useState<KondisiBarang>(KondisiBarang.BAIK);
  const [deskripsi, setDeskripsi] = useState("");
  const [status, setStatus] = useState<StatusBarang>(StatusBarang.TERSEDIA);
  const [error, setError] = useState("");

  // Selected Item for Delete/Info
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBarangList(dbService.getBarang());
  };

  // Filter & Pagination Logic
  const filteredData = barangList.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKondisi = filterKondisi
      ? item.kondisi === filterKondisi
      : true;
    const matchesStatus = filterStatus ? item.status === filterStatus : true;

    return matchesSearch && matchesKondisi && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (item?: Barang) => {
    setError("");
    if (item) {
      setEditingId(item.id_barang);
      setNama(item.nama_barang);
      setKode(item.kode_barang);
      setKondisi(item.kondisi);
      setDeskripsi(item.deskripsi);
      setStatus(item.status);
    } else {
      setEditingId(null);
      setNama("");
      setKode("");
      setKondisi(KondisiBarang.BAIK);
      setDeskripsi("");
      setStatus(StatusBarang.TERSEDIA);
    }
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: Barang) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleOpenInfo = (item: Barang) => {
    setSelectedItem(item);
    setIsInfoModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nama || !kode) {
      setError("Nama dan Kode Barang wajib diisi");
      return;
    }

    try {
      if (editingId) {
        dbService.updateBarang(editingId, {
          nama_barang: nama,
          kode_barang: kode,
          kondisi,
          deskripsi,
          status,
        });
        showAlert("Berhasil", "Data barang berhasil diperbarui", "success");
      } else {
        dbService.createBarang({
          nama_barang: nama,
          kode_barang: kode,
          kondisi,
          deskripsi,
          status,
        });
        showAlert("Berhasil", "Barang baru berhasil ditambahkan", "success");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      dbService.deleteBarang(selectedItem.id_barang);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      loadData();
      showAlert("Berhasil", "Barang berhasil dihapus", "success");
    }
  };

  const handleExport = () => {
    const dataToExport = barangList.map((item) => ({
      "Nama Barang": item.nama_barang,
      "Kode Barang": item.kode_barang,
      Kondisi: item.kondisi,
      Deskripsi: item.deskripsi,
      Status: item.status,
    }));
    excelService.exportToExcel(dataToExport, "Data_Barang");
    showAlert("success", "Data berhasil diexport ke Excel");
  };

  const handleDownloadTemplate = () => {
    const columns = ["nama_barang", "kode_barang", "kondisi", "deskripsi"];
    excelService.downloadTemplate(columns, "Template_Barang");
    showAlert("success", "Template berhasil diunduh");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await excelService.readExcel(file);
      let successCount = 0;
      let failCount = 0;

      data.forEach((row: any) => {
        try {
          // Validate required fields
          if (!row.nama_barang || !row.kode_barang) {
            failCount++;
            return;
          }

          // Map Excel row to Barang object
          // Default values if missing
          const newBarang: Omit<Barang, "id_barang"> = {
            nama_barang: row.nama_barang,
            kode_barang: row.kode_barang,
            kondisi: Object.values(KondisiBarang).includes(row.kondisi)
              ? row.kondisi
              : KondisiBarang.BAIK,
            deskripsi: row.deskripsi || "",
            status: StatusBarang.TERSEDIA,
          };

          dbService.createBarang(newBarang);
          successCount++;
        } catch (error) {
          failCount++;
        }
      });

      loadData();
      showAlert(
        successCount > 0 ? "success" : "error",
        `Import selesai. Berhasil: ${successCount}, Gagal: ${failCount}`
      );
      setIsImportModalOpen(false);
    } catch (error) {
      showAlert("error", "Gagal membaca file Excel");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CubeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Data Barang
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm text-sm"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 shadow-sm text-sm"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm text-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">
            Daftar Inventaris Barang
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Cari barang..."
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={filterKondisi}
              onChange={(e) => {
                setFilterKondisi(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Kondisi</option>
              {Object.values(KondisiBarang).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Status</option>
              {Object.values(StatusBarang).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
              Total: {filteredData.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-medium">
              <tr>
                <th className="px-6 py-3 tracking-wider">Kode</th>
                <th className="px-6 py-3 tracking-wider">Nama Barang</th>
                <th className="px-6 py-3 tracking-wider">Kondisi</th>
                <th className="px-6 py-3 tracking-wider">Status</th>
                <th className="px-6 py-3 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.map((row) => (
                <tr
                  key={row.id_barang}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono">
                    {row.kode_barang}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {row.nama_barang}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.kondisi === KondisiBarang.BAIK
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : row.kondisi === KondisiBarang.RUSAK_RINGAN
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {row.kondisi}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === StatusBarang.TERSEDIA
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenInfo(row)}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Lihat Detail"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(row)}
                      className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(row)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Hapus"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    {searchTerm
                      ? "Barang tidak ditemukan"
                      : "Tidak ada data barang"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal Form (Add/Edit) */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingId ? "Edit Barang" : "Tambah Barang Baru"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Kode Barang
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={kode}
                      onChange={(e) => setKode(e.target.value)}
                      placeholder="Contoh: LPT-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Kondisi
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={kondisi}
                      onChange={(e) =>
                        setKondisi(e.target.value as KondisiBarang)
                      }
                    >
                      {Object.values(KondisiBarang).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama Barang"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi / Kelengkapan
                  </label>
                  <textarea
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Contoh: Unit + Charger + Tas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Awal
                  </label>
                  <select
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusBarang)}
                  >
                    {Object.values(StatusBarang).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
        selectedItem &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Hapus Barang?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Anda yakin ingin menghapus{" "}
                <strong>{selectedItem.nama_barang}</strong>? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm hover:shadow transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Info Modal */}
      {isInfoModalOpen &&
        selectedItem &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Detail Barang
                </h3>
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Nama Barang
                  </label>
                  <p className="text-slate-800 dark:text-white font-medium text-lg">
                    {selectedItem.nama_barang}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      Kode
                    </label>
                    <p className="text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded inline-block text-sm">
                      {selectedItem.kode_barang}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      Status
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedItem.status === StatusBarang.TERSEDIA
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {selectedItem.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Kondisi
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedItem.kondisi === KondisiBarang.BAIK
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : selectedItem.kondisi === KondisiBarang.RUSAK_RINGAN
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {selectedItem.kondisi}
                    </span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                  <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-2">
                    Deskripsi / Kelengkapan
                  </label>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {selectedItem.deskripsi || "-"}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-b-xl border-t border-slate-100 dark:border-slate-700 text-right">
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Import Modal */}
      {isImportModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Import Data Barang
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
                    Gunakan template yang telah disediakan untuk memastikan
                    format data benar.
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default DataBarang;
