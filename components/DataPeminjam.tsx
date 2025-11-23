import React, { useState, useEffect } from "react";
import { dbService } from "../services/databaseService";
import { Peminjam, TipePeminjam } from "../types";
import { useAlert } from "./AlertModal";
import {
  UserPlusIcon,
  XMarkIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const DataPeminjam: React.FC = () => {
  const { showAlert } = useAlert();
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipe, setFilterTipe] = useState<TipePeminjam | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [nomorInduk, setNomorInduk] = useState("");
  const [tipe, setTipe] = useState<TipePeminjam>(TipePeminjam.SISWA);
  const [error, setError] = useState("");

  // Selected Item for Delete
  const [selectedItem, setSelectedItem] = useState<Peminjam | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPeminjamList(dbService.getPeminjam());
  };

  // Filter & Pagination Logic
  const filteredData = peminjamList.filter((item) => {
    const matchesSearch =
      item.nama_peminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomor_induk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipe = filterTipe ? item.tipe_peminjam === filterTipe : true;
    return matchesSearch && matchesTipe;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (item?: Peminjam) => {
    setError("");
    if (item) {
      setEditingId(item.id_peminjam);
      setNama(item.nama_peminjam);
      setNomorInduk(item.nomor_induk);
      setTipe(item.tipe_peminjam);
    } else {
      setEditingId(null);
      setNama("");
      setNomorInduk("");
      setTipe(TipePeminjam.SISWA);
    }
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: Peminjam) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nama || !nomorInduk) {
      setError("Semua field wajib diisi");
      return;
    }

    try {
      if (editingId) {
        dbService.updatePeminjam(editingId, {
          nama_peminjam: nama,
          nomor_induk: nomorInduk,
          tipe_peminjam: tipe,
        });
        showAlert("Berhasil", "Data peminjam berhasil diperbarui", "success");
      } else {
        dbService.createPeminjam({
          nama_peminjam: nama,
          nomor_induk: nomorInduk,
          tipe_peminjam: tipe,
        });
        showAlert("Berhasil", "Peminjam berhasil ditambahkan", "success");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      dbService.deletePeminjam(selectedItem.id_peminjam);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      loadData();
      showAlert("Berhasil", "Peminjam berhasil dihapus", "success");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Data Peminjam
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <UserPlusIcon className="w-5 h-5" />
          Tambah Peminjam
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">
            Daftar Peminjam Terdaftar
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Cari peminjam..."
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={filterTipe}
              onChange={(e) => {
                setFilterTipe(e.target.value as TipePeminjam | "");
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Tipe</option>
              {Object.values(TipePeminjam).map((t) => (
                <option key={t} value={t}>
                  {t}
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
                <th className="px-6 py-3 tracking-wider">Nomor Induk</th>
                <th className="px-6 py-3 tracking-wider">Nama Peminjam</th>
                <th className="px-6 py-3 tracking-wider">Tipe</th>
                <th className="px-6 py-3 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.map((row) => (
                <tr
                  key={row.id_peminjam}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono">
                    {row.nomor_induk}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {row.nama_peminjam}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.tipe_peminjam === TipePeminjam.GURU
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {row.tipe_peminjam}
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
                    colSpan={4}
                    className="px-6 py-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    {searchTerm
                      ? "Peminjam tidak ditemukan"
                      : "Tidak ada data peminjam"}
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

      {/* Modal Tambah/Edit Peminjam */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? "Edit Peminjam" : "Tambah Peminjam Baru"}
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
                  Tipe Peminjam
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipe"
                      value={TipePeminjam.SISWA}
                      checked={tipe === TipePeminjam.SISWA}
                      onChange={() => setTipe(TipePeminjam.SISWA)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Siswa
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipe"
                      value={TipePeminjam.GURU}
                      checked={tipe === TipePeminjam.GURU}
                      onChange={() => setTipe(TipePeminjam.GURU)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Guru
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {tipe === TipePeminjam.GURU ? "NIP" : "NISN"} (Nomor Induk)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={nomorInduk}
                  onChange={(e) => setNomorInduk(e.target.value)}
                  placeholder={
                    tipe === TipePeminjam.GURU
                      ? "Contoh: 198001..."
                      : "Contoh: 005123..."
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama Peminjam"
                  required
                />
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Hapus Peminjam?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Anda yakin ingin menghapus{" "}
              <strong>{selectedItem.nama_peminjam}</strong>? Tindakan ini tidak
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
        </div>
      )}
    </div>
  );
};

export default DataPeminjam;
