import React, { useState, useEffect } from "react";
import { dbService } from "../services/databaseService";
import {
  Barang,
  Ruangan,
  Peminjam,
  StatusBarang,
  StatusRuangan,
  TipePeminjam,
} from "../types";
import {
  PlusIcon,
  TrashIcon,
  ShoppingCartIcon,
  UserIcon,
  CalendarIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface TransaksiBaruProps {
  onSuccess: () => void;
}

type CartItem = {
  type: "BARANG" | "RUANGAN";
  id: number;
  name: string;
  code?: string; // For Barang
  description?: string; // For Barang
};

const TransaksiBaru: React.FC<TransaksiBaruProps> = ({ onSuccess }) => {
  const [peminjamList, setPeminjamList] = useState<Peminjam[]>([]);
  const [availableBarang, setAvailableBarang] = useState<Barang[]>([]);
  const [availableRuangan, setAvailableRuangan] = useState<Ruangan[]>([]);

  const [selectedPeminjam, setSelectedPeminjam] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tanggalKembali, setTanggalKembali] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [activeTab, setActiveTab] = useState<"BARANG" | "RUANGAN">("BARANG");
  const [selectedItem, setSelectedItem] = useState<number | "">("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newNomorInduk, setNewNomorInduk] = useState("");
  const [newTipe, setNewTipe] = useState<TipePeminjam>(TipePeminjam.SISWA);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPeminjamList(dbService.getPeminjam());
    setAvailableBarang(
      dbService.getBarang().filter((b) => b.status === StatusBarang.TERSEDIA)
    );
    setAvailableRuangan(
      dbService.getRuangan().filter((r) => r.status === StatusRuangan.TERSEDIA)
    );
  };

  const handleAddPeminjam = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!newNama || !newNomorInduk) {
      setModalError("Semua field wajib diisi");
      return;
    }

    try {
      dbService.createPeminjam({
        nama_peminjam: newNama,
        nomor_induk: newNomorInduk,
        tipe_peminjam: newTipe,
      });

      // Refresh list and select new user
      const updatedList = dbService.getPeminjam();
      setPeminjamList(updatedList);

      // Find the new user (paling akhir ditambahkan)
      const newUser = updatedList[updatedList.length - 1];
      if (newUser) {
        setSelectedPeminjam(newUser.id_peminjam);
        setSearchTerm(newUser.nama_peminjam);
      }

      // Reset & Close
      setNewNama("");
      setNewNomorInduk("");
      setNewTipe(TipePeminjam.SISWA);
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) return;

    if (activeTab === "BARANG") {
      const item = availableBarang.find(
        (b) => b.id_barang === Number(selectedItem)
      );
      if (item) {
        setCart([
          ...cart,
          {
            type: "BARANG",
            id: item.id_barang,
            name: item.nama_barang,
            code: item.kode_barang,
            description: item.deskripsi,
          },
        ]);
        // Remove from available list temporarily (UI only)
        setAvailableBarang((prev) =>
          prev.filter((b) => b.id_barang !== item.id_barang)
        );
      }
    } else {
      const item = availableRuangan.find(
        (r) => r.id_ruangan === Number(selectedItem)
      );
      if (item) {
        setCart([
          ...cart,
          {
            type: "RUANGAN",
            id: item.id_ruangan,
            name: item.nama_ruangan,
          },
        ]);
        setAvailableRuangan((prev) =>
          prev.filter((r) => r.id_ruangan !== item.id_ruangan)
        );
      }
    }
    setSelectedItem("");
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = cart[index];
    setCart(cart.filter((_, i) => i !== index));

    // Add back to available list
    if (itemToRemove.type === "BARANG") {
      // We need to fetch the full object again or just rely on reloading from DB?
      // Better to just reload from DB to be safe or keep a local cache.
      // For simplicity, let's just reload all data to ensure consistency,
      // but that might reset other selections.
      // Let's find the original item from the full DB list (which we don't have in state).
      // Actually, we can just fetch the single item from DB service or just reload everything.
      // Reloading everything is safest but might be slow.
      // Let's just re-fetch the specific item from DB service since we have the ID.
      const allBarang = dbService.getBarang();
      const originalItem = allBarang.find(
        (b) => b.id_barang === itemToRemove.id
      );
      if (originalItem) {
        setAvailableBarang((prev) =>
          [...prev, originalItem].sort((a, b) =>
            a.nama_barang.localeCompare(b.nama_barang)
          )
        );
      }
    } else {
      const allRuangan = dbService.getRuangan();
      const originalItem = allRuangan.find(
        (r) => r.id_ruangan === itemToRemove.id
      );
      if (originalItem) {
        setAvailableRuangan((prev) =>
          [...prev, originalItem].sort((a, b) =>
            a.nama_ruangan.localeCompare(b.nama_ruangan)
          )
        );
      }
    }
  };

  const handleSubmit = () => {
    // Try to resolve peminjam from search term if not selected (handles race condition with onBlur)
    let finalPeminjamId = selectedPeminjam;
    if (!finalPeminjamId && searchTerm) {
      const exactMatch = peminjamList.find(
        (p) =>
          p.nama_peminjam.toLowerCase().trim() ===
          searchTerm.toLowerCase().trim()
      );
      if (exactMatch) {
        finalPeminjamId = exactMatch.id_peminjam;
        setSelectedPeminjam(exactMatch.id_peminjam);
      }
    }

    if (!finalPeminjamId) {
      alert("Mohon pilih peminjam terlebih dahulu");
      return;
    }
    if (!tanggalKembali) {
      alert("Mohon tentukan tanggal rencana kembali");
      return;
    }
    if (cart.length === 0) {
      alert(
        "Keranjang peminjaman masih kosong. Silakan tambah Barang atau Ruangan."
      );
      return;
    }

    dbService.createTransaksi(
      Number(finalPeminjamId),
      tanggalKembali,
      cart.map((item) => ({ type: item.type, id: item.id }))
    );

    alert("Transaksi berhasil dibuat!");
    onSuccess();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
            <UserIcon className="w-5 h-5" />
            Data Peminjam
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Peminjam
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                    selectedPeminjam
                      ? "border-green-500 bg-green-50"
                      : "border-slate-300"
                  }`}
                  placeholder="Cari nama peminjam..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedPeminjam) setSelectedPeminjam("");
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => {
                      setIsDropdownOpen(false);
                      // Auto-select if exact match found and not selected
                      if (!selectedPeminjam && searchTerm) {
                        const exactMatch = peminjamList.find(
                          (p) =>
                            p.nama_peminjam.toLowerCase() ===
                            searchTerm.toLowerCase()
                        );
                        if (exactMatch) {
                          setSelectedPeminjam(exactMatch.id_peminjam);
                          setSearchTerm(exactMatch.nama_peminjam);
                        }
                      }
                    }, 200);
                  }}
                />
                {selectedPeminjam && (
                  <div className="absolute right-3 top-2.5 text-green-600 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {peminjamList.filter((p) =>
                        p.nama_peminjam
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      ).length > 0 ? (
                        <ul>
                          {peminjamList
                            .filter((p) =>
                              p.nama_peminjam
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            )
                            .map((p) => (
                              <li
                                key={p.id_peminjam}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setSelectedPeminjam(p.id_peminjam);
                                  setSearchTerm(p.nama_peminjam);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <div className="font-medium">
                                  {p.nama_peminjam}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {p.tipe_peminjam} - {p.nomor_induk}
                                </div>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-slate-500 mb-2">
                            Peminjam tidak ditemukan
                          </p>
                          <button
                            onClick={() => {
                              setIsModalOpen(true);
                              setIsDropdownOpen(false);
                            }}
                            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 mx-auto"
                          >
                            <UserPlusIcon className="w-4 h-4" />
                            Buat Baru
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rencana Kembali
              </label>
              <input
                type="date"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={tanggalKembali}
                onChange={(e) => setTanggalKembali(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
            <PlusIcon className="w-5 h-5" />
            Tambah Item
          </h3>

          <div className="flex gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "BARANG"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => {
                setActiveTab("BARANG");
                setSelectedItem("");
              }}
            >
              Barang
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "RUANGAN"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => {
                setActiveTab("RUANGAN");
                setSelectedItem("");
              }}
            >
              Ruangan
            </button>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pilih {activeTab === "BARANG" ? "Barang" : "Ruangan"}
              </label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedItem}
                onChange={(e) => setSelectedItem(Number(e.target.value))}
              >
                <option value="">-- Pilih Item --</option>
                {activeTab === "BARANG"
                  ? availableBarang.map((b) => (
                      <option key={b.id_barang} value={b.id_barang}>
                        {b.kode_barang} - {b.nama_barang} ({b.kondisi})
                      </option>
                    ))
                  : availableRuangan.map((r) => (
                      <option key={r.id_ruangan} value={r.id_ruangan}>
                        {r.nama_ruangan}
                      </option>
                    ))}
              </select>
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleAddItem}
              disabled={!selectedItem}
            >
              <PlusIcon className="w-5 h-5" />
              Tambah
            </button>
          </div>

          {/* Helper Text for Barang */}
          {activeTab === "BARANG" && selectedItem && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <span className="font-semibold">Kelengkapan:</span>{" "}
              {availableBarang.find((b) => b.id_barang === Number(selectedItem))
                ?.deskripsi || "-"}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700 border-b pb-4">
          <ShoppingCartIcon className="w-5 h-5" />
          Keranjang Peminjaman
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>Belum ada item dipilih</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start group"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  {item.type === "BARANG" && (
                    <p className="text-xs text-slate-500">
                      {item.code} • {item.description}
                    </p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">
                    {item.type}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-slate-600">Total Item</span>
            <span className="font-bold text-slate-800">{cart.length}</span>
          </div>
          <button
            className={`w-full py-3 rounded-xl font-semibold shadow-sm hover:shadow transition-all ${
              cart.length > 0 && selectedPeminjam && tanggalKembali
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-slate-200 text-slate-500"
            }`}
            onClick={handleSubmit}
          >
            Proses Peminjaman
          </button>
        </div>
      </div>

      {/* Modal for Adding Peminjam */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">
              Tambah Peminjam Baru
            </h3>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddPeminjam}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Peminjam
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nomor Induk
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newNomorInduk}
                  onChange={(e) => setNewNomorInduk(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipe Peminjam
                </label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTipe}
                  onChange={(e) => setNewTipe(e.target.value as TipePeminjam)}
                >
                  <option value={TipePeminjam.SISWA}>Siswa</option>
                  <option value={TipePeminjam.GURU}>Guru</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Tambah Peminjam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransaksiBaru;
