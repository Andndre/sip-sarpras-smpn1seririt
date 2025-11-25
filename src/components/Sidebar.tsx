import React from "react";
import { ViewState } from "../types";
import { APP_NAME, SCHOOL_NAME } from "../constants";
import {
  HomeIcon,
  PlusCircleIcon,
  ArrowPathRoundedSquareIcon,
  ClockIcon,
  CubeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: "DASHBOARD", label: "Dashboard", icon: HomeIcon },
    { section: "PEMINJAMAN" },
    { id: "PEMINJAMAN_BARU", label: "Peminjaman Baru", icon: PlusCircleIcon },
    {
      id: "PENGEMBALIAN",
      label: "Pengembalian",
      icon: ArrowPathRoundedSquareIcon,
    },
    { id: "RIWAYAT", label: "Riwayat", icon: ClockIcon },
    { section: "MASTER DATA" },
    { id: "DATA_BARANG", label: "Data Barang", icon: CubeIcon },
    { id: "DATA_RUANGAN", label: "Data Ruangan", icon: BuildingOfficeIcon },
    { id: "DATA_PEMINJAM", label: "Data Peminjam", icon: UserGroupIcon },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <img src="./logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-md font-bold text-blue-600 dark:text-blue-400 leading-tight">
            {SCHOOL_NAME}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {APP_NAME}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item, idx) => {
            if (item.section) {
              return (
                <li
                  key={idx}
                  className="px-6 py-3 mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider"
                >
                  {item.section}
                </li>
              );
            }

            const Icon = item.icon as React.ElementType;
            const isActive = currentView === item.id;

            return (
              <li key={idx}>
                <button
                  onClick={() => onChangeView(item.id as ViewState)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600">
            v1
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {APP_NAME}
            </p>
            <p className="text-xs text-slate-500">Versi 1.0.7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
