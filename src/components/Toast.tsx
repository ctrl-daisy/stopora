"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  type: "error" | "success" | "info";
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: "error" | "success" | "info") => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: "error" | "success" | "info" = "error") => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:max-w-md sm:left-auto sm:right-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all ${
              toast.type === "error"
                ? "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800"
                : toast.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800"
                : "bg-gray-900 text-white border-gray-700 dark:bg-gray-100 dark:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3 pr-2">
              <span className="text-lg">
                {toast.type === "error" ? "⚠️" : toast.type === "success" ? "✓" : "ℹ️"}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded-lg"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
