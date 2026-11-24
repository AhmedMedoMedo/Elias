import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastItem } from '../types';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'تأكيد',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              destructive
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-blue-500/15 text-blue-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-bold text-white cursor-pointer ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="no-print fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-bold shadow-lg border ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : t.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : t.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <Info className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="opacity-75 hover:opacity-100 cursor-pointer"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
