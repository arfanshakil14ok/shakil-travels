'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CircleCheck, TriangleAlert, CircleX, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './icon-button';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = item.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);

  const icons = {
    success: <CircleCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />,
    warning: <TriangleAlert className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />,
    error: <CircleX className="w-5 h-5 text-rose-500 flex-shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-l-4 border-l-emerald-500',
    warning: 'border-l-4 border-l-amber-500',
    error: 'border-l-4 border-l-rose-500',
    info: 'border-l-4 border-l-sky-500',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, warning, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 bg-white rounded-lg shadow-xl border border-slate-200 animate-in slide-in-from-bottom-5 transition-all',
              borders[t.type]
            )}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              {t.title && <h4 className="text-sm font-semibold text-slate-900">{t.title}</h4>}
              <p className="text-xs text-slate-600 mt-0.5">{t.message}</p>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Dismiss notification"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 -mr-2 -mt-2"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
