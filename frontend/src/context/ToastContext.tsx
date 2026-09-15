import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });

    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <aside
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-5 left-1/2 z-[100] -translate-x-1/2 animate-toast-enter pointer-events-none"
        >
          <div
            className={`flex items-center gap-2.5 rounded-full px-5 py-2.5 shadow-lg border text-sm font-semibold tracking-tight transition-all duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-500/30 backdrop-blur-md shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-500/30 backdrop-blur-md shadow-rose-950/20'
                : 'bg-slate-900/90 text-white border-slate-700/50 backdrop-blur-md'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </aside>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};