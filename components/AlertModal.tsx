import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type AlertType = "success" | "error" | "warning";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onClose?: () => void;
}

interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    type?: AlertType,
    onClose?: () => void
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = "success",
    onClose?: () => void
  ) => {
    setAlertState({ isOpen: true, title, message, type, onClose });
  };

  const hideAlert = () => {
    if (alertState.onClose) {
      alertState.onClose();
    }
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scaleIn">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-opacity-10">
                {alertState.type === "success" && (
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full animate-bounce">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                )}
                {alertState.type === "error" && (
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full animate-shake">
                    <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                )}
                {alertState.type === "warning" && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full animate-pulse">
                    <ExclamationTriangleIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {alertState.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {alertState.message}
              </p>
              <button
                onClick={hideAlert}
                className={`w-full inline-flex justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${
                  alertState.type === "success"
                    ? "bg-green-600 hover:bg-green-700 focus-visible:outline-green-600"
                    : alertState.type === "error"
                    ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
                    : "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600"
                }`}
              >
                OK, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
