import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TransaksiBaru from "./components/TransaksiBaru";
import Pengembalian from "./components/Pengembalian";
import Riwayat from "./components/Riwayat";
import DataPeminjam from "./components/DataPeminjam";
import DataBarang from "./components/DataBarang";
import DataRuangan from "./components/DataRuangan";
import {
  ViewState,
  DashboardStats,
  TransaksiPeminjaman,
  Barang,
  KondisiBarang,
} from "./types";
import { dbService } from "./services/databaseService";
import {
  CubeIcon,
  BuildingOfficeIcon,
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  PlusIcon,
  PlusCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<TransaksiPeminjaman[]>(
    []
  );
  const [damagedItems, setDamagedItems] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  // State for showing all damaged items
  const [showAllDamaged, setShowAllDamaged] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Simulate loading stats on mount and view change
  useEffect(() => {
    setLoading(true);
    // Small timeout to simulate async fetch
    setTimeout(() => {
      setStats(dbService.getStats());

      // Fetch Recent Activity (Last 5 transactions)
      const allTrans = dbService.getTransaksi();
      setRecentActivity([...allTrans].reverse().slice(0, 5));

      // Fetch Damaged Items
      const allBarang = dbService.getBarang();
      setDamagedItems(
        allBarang.filter((b) => b.kondisi !== KondisiBarang.BAIK)
      );

      setLoading(false);
    }, 300);
  }, [currentView]);

  const renderContent = () => {
    switch (currentView) {
      case "DASHBOARD":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Dashboard Overview
            </h2>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView("PEMINJAMAN_BARU")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Peminjaman Baru
              </button>
              <button
                onClick={() => setCurrentView("PENGEMBALIAN")}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Proses Pengembalian
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat Cards */}
              <StatCard
                title="Total Barang"
                value={stats?.totalBarang || 0}
                icon={CubeIcon}
                color="bg-blue-500"
              />
              <StatCard
                title="Barang Tersedia"
                value={stats?.barangTersedia || 0}
                icon={CheckCircleIcon}
                color="bg-green-500"
              />
              <StatCard
                title="Total Ruangan"
                value={stats?.totalRuangan || 0}
                icon={BuildingOfficeIcon}
                color="bg-indigo-500"
              />
              <StatCard
                title="Peminjaman Aktif"
                value={stats?.transaksiAktif || 0}
                icon={ClockIcon}
                color="bg-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ArrowPathRoundedSquareIcon className="w-5 h-5 text-slate-400" />
                  Aktivitas Terbaru
                </h3>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">
                      Belum ada aktivitas peminjaman.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((t) => (
                        <div
                          key={t.id_transaksi}
                          className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              Peminjaman #{t.id_transaksi.slice(0, 5)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(t.tanggal_pinjam).toLocaleString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              t.status_transaksi === "Dipinjam"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {t.status_transaksi}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Damaged Items Alert */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  Barang Perlu Perhatian
                </h3>
                <div className="space-y-4">
                  {damagedItems.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        Semua barang dalam kondisi baik.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(showAllDamaged
                        ? damagedItems
                        : damagedItems.slice(0, 2)
                      ).map((b) => (
                        <div
                          key={b.id_barang}
                          className="flex justify-between items-start p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {b.nama_barang}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {b.kode_barang}
                            </p>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
                            {b.kondisi}
                          </span>
                        </div>
                      ))}

                      {damagedItems.length > 2 && !showAllDamaged && (
                        <button
                          className="w-full mt-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/40 dark:hover:bg-slate-700 dark:focus:ring-blue-500"
                          onClick={() => setShowAllDamaged(true)}
                        >
                          Lihat lainnya ({damagedItems.length - 2} barang)
                        </button>
                      )}

                      {damagedItems.length > 2 && showAllDamaged && (
                        <button
                          className="w-full mt-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/40 dark:hover:bg-slate-700 dark:focus:ring-blue-500"
                          onClick={() => setShowAllDamaged(false)}
                        >
                          Tampilkan lebih sedikit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "DATA_BARANG":
        return <DataBarang />;

      case "DATA_RUANGAN":
        return <DataRuangan />;

      case "DATA_PEMINJAM":
        return <DataPeminjam />;

      case "PEMINJAMAN_BARU":
        return <TransaksiBaru onSuccess={() => setCurrentView("DASHBOARD")} />;

      case "PENGEMBALIAN":
        return <Pengembalian onSuccess={() => setCurrentView("RIWAYAT")} />;

      case "RIWAYAT":
        return <Riwayat />;

      default:
        return (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-600">
                Modul Dalam Pengembangan
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Fitur {(currentView as string).replace("_", " ")} akan segera
                hadir.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-200">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      <main className="flex-1 ml-64 p-8">
        {/* Header Area */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {currentView.replace(/_/g, " ")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Selamat Datang di Panel Admin
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-amber-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="fade-in">{renderContent()}</div>
        )}
      </main>
    </div>
  );
};

// --- Helper Components for this step ---

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition hover:-translate-y-1 duration-200">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace("bg-", "text-")}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {title}
      </p>
      <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
        {value}
      </h4>
    </div>
  </div>
);

const SimpleTable = ({ title, data, columns }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
        {data.length} Record(s)
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase text-xs font-medium">
          <tr>
            {columns.map((col: string) => (
              <th key={col} className="px-6 py-3 tracking-wider">
                {col.replace("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {data.map((row: any, idx: number) => (
            <tr
              key={idx}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              {columns.map((col: string) => (
                <td
                  key={col}
                  className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  {col === "status" || col === "kondisi" ? (
                    <StatusBadge status={row[col]} />
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-slate-400 dark:text-slate-500"
              >
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  let colorClass =
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  if (status === "Tersedia" || status === "Baik")
    colorClass =
      "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
  if (status === "Dipinjam" || status === "Rusak Ringan")
    colorClass =
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  if (status === "Rusak Berat")
    colorClass =
      "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default App;
