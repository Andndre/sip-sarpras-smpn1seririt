import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TransaksiBaru from "./components/TransaksiBaru";
import Pengembalian from "./components/Pengembalian";
import Riwayat from "./components/Riwayat";
import DataPeminjam from "./components/DataPeminjam";
import DataBarang from "./components/DataBarang";
import DataRuangan from "./components/DataRuangan";
import { ViewState, DashboardStats } from "./types";
import { dbService } from "./services/databaseService";
import {
  CubeIcon,
  BuildingOfficeIcon,
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading stats on mount and view change
  useEffect(() => {
    setLoading(true);
    // Small timeout to simulate async fetch
    setTimeout(() => {
      setStats(dbService.getStats());
      setLoading(false);
    }, 300);
  }, [currentView]);

  const renderContent = () => {
    switch (currentView) {
      case "DASHBOARD":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Dashboard Overview
            </h2>

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
                title="Transaksi Aktif"
                value={stats?.transaksiAktif || 0}
                icon={ArrowPathRoundedSquareIcon}
                color="bg-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">
                  Aktivitas Terbaru
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 italic">
                    Belum ada aktivitas baru.
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">
                  Peringatan Stok
                </h3>
                <p className="text-sm text-slate-500">
                  Semua barang dalam kondisi aman.
                </p>
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

      case "TRANSAKSI_BARU":
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
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      <main className="flex-1 ml-64 p-8">
        {/* Header Area */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {currentView.replace(/_/g, " ")}
            </h1>
            <p className="text-slate-500 text-sm">
              Selamat Datang di Panel Admin
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
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
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition hover:-translate-y-1 duration-200">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${color.replace("bg-", "text-")}`} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    </div>
  </div>
);

const SimpleTable = ({ title, data, columns }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
        {data.length} Record(s)
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-medium">
          <tr>
            {columns.map((col: string) => (
              <th key={col} className="px-6 py-3 tracking-wider">
                {col.replace("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-slate-50">
              {columns.map((col: string) => (
                <td
                  key={col}
                  className="px-6 py-4 text-slate-700 whitespace-nowrap"
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
                className="px-6 py-8 text-center text-slate-400"
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
  let colorClass = "bg-slate-100 text-slate-600";
  if (status === "Tersedia" || status === "Baik")
    colorClass = "bg-green-100 text-green-700 border border-green-200";
  if (status === "Dipinjam" || status === "Rusak Ringan")
    colorClass = "bg-amber-100 text-amber-700 border border-amber-200";
  if (status === "Rusak Berat")
    colorClass = "bg-red-100 text-red-700 border border-red-200";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default App;
