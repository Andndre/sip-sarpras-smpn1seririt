import React, { useState, useEffect } from "react";
import { dbService } from "../services/databaseService";
import { Ruangan, StatusRuangan } from "../types";
import { useAlert } from "./AlertModal";
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const DataRuangan: React.FC = () => {
  const { showAlert } = useAlert();
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
          Data Ruangan
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Ruangan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Daftar Ruangan</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Cari ruangan..."
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
              Total: {filteredData.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-medium">
              <tr>
                <th className="px-6 py-3 tracking-wider">Nama Ruangan</th>
                <th className="px-6 py-3 tracking-wider">Status</th>
                <th className="px-6 py-3 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => (
                <tr key={row.id_ruangan} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {row.nama_ruangan}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === StatusRuangan.TERSEDIA
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(row)}
                      className="text-slate-400 hover:text-amber-600 transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(row)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
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
                    className="px-6 py-8 text-center text-slate-400"
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal Form (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Lab Komputer 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Hapus Ruangan?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Anda yakin ingin menghapus{" "}
              <strong>{selectedItem.nama_ruangan}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
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

export default DataRuangan;
