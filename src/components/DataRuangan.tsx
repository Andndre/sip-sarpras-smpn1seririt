import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../services/databaseService";
import { excelService } from "../services/excelService";
import { Ruangan, StatusRuangan } from "../types";
import { useAlert } from "./AlertModal";
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";

const DataRuangan: React.FC = () => {
  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusRuangan | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [status, setStatus] = useState<StatusRuangan>(StatusRuangan.TERSEDIA);
  const [error, setError] = useState("");

  // Selected Item for Delete
  const [selectedItem, setSelectedItem] = useState<Ruangan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRuanganList(dbService.getRuangan());
  };

  // Filter & Pagination Logic
  const filteredData = ruanganList.filter((item) => {
    const matchesSearch = item.nama_ruangan
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (item?: Ruangan) => {
    setError("");
    if (item) {
      setEditingId(item.id_ruangan);
      setNama(item.nama_ruangan);
      setStatus(item.status);
    } else {
      setEditingId(null);
      setNama("");
      setStatus(StatusRuangan.TERSEDIA);
    }
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: Ruangan) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nama) {
      setError("Nama Ruangan wajib diisi");
      return;
    }

    try {
      if (editingId) {
        dbService.updateRuangan(editingId, {
          nama_ruangan: nama,
          status,
        });
        showAlert("Berhasil", "Data ruangan berhasil diperbarui", "success");
      } else {
        dbService.createRuangan({
          nama_ruangan: nama,
          status,
        });
        showAlert("Berhasil", "Ruangan baru berhasil ditambahkan", "success");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      dbService.deleteRuangan(selectedItem.id_ruangan);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      loadData();
      showAlert("Berhasil", "Ruangan berhasil dihapus", "success");
    }
  };

  const handleExport = () => {
    const dataToExport = ruanganList.map((item) => ({
      "Nama Ruangan": item.nama_ruangan,
      Status: item.status,
    }));
    excelService.exportToExcel(dataToExport, "Data_Ruangan");
    showAlert("success", "Data berhasil diexport ke Excel");
  };

  const handleDownloadTemplate = () => {
    const columns = ["nama_ruangan"];
    excelService.downloadTemplate(columns, "Template_Ruangan");
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
          if (!row.nama_ruangan) {
            failCount++;
            return;
          }

          const newRuangan: Omit<Ruangan, "id_ruangan"> = {
            nama_ruangan: row.nama_ruangan,
            status: StatusRuangan.TERSEDIA,
          };

          dbService.createRuangan(newRuangan);
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
          <BuildingOfficeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Data Ruangan
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
            Daftar Ruangan
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Cari ruangan..."
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as StatusRuangan | "");
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Status</option>
              {Object.values(StatusRuangan).map((s) => (
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
                <th className="px-6 py-3 tracking-wider">Nama Ruangan</th>
                <th className="px-6 py-3 tracking-wider">Status</th>
                <th className="px-6 py-3 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.map((row) => (
                <tr
                  key={row.id_ruangan}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {row.nama_ruangan}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === StatusRuangan.TERSEDIA
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
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
                    colSpan={3}
                    className="px-6 py-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    {searchTerm
                      ? "Ruangan tidak ditemukan"
                      : "Tidak ada data ruangan"}
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Ruangan
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Lab Komputer 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusRuangan)}
                  >
                    {Object.values(StatusRuangan).map((s) => (
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
                Hapus Ruangan?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Anda yakin ingin menghapus{" "}
                <strong>{selectedItem.nama_ruangan}</strong>? Tindakan ini tidak
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

      {/* Import Modal */}
      {isImportModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Import Data Ruangan
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

export default DataRuangan;
