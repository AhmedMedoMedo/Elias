import React from 'react';
import { ImagePlus, RotateCw, Trash2, X } from 'lucide-react';
import type { ProductRow } from '../types';

interface ImageLightboxModalProps {
  row: ProductRow | null;
  onClose: () => void;
  onRotate: (rowId: string) => void;
  onReplace: (rowId: string) => void;
  onRemoveImage: (rowId: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  row,
  onClose,
  onRotate,
  onReplace,
  onRemoveImage,
}) => {
  if (!row || !row.img) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {row.vals.code ? String(row.vals.code) : 'معاينة الصورة'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {row.w} × {row.h} px
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-[#090E1A] flex items-center justify-center max-h-[65vh]">
          <img
            src={row.img}
            alt={String(row.vals.code || 'صورة البضاعة')}
            referrerPolicy="no-referrer"
            className="max-h-[60vh] max-w-full object-contain rounded-lg"
          />
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRotate(row.id)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تدوير 90°</span>
            </button>
            <button
              type="button"
              onClick={() => onReplace(row.id)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>تغيير الصورة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onRemoveImage(row.id);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 px-3 py-2 text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>إزالة الصورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
