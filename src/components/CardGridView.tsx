import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ImagePlus,
  Plus,
  RotateCw,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import type { ProductRow, SheetDoc } from '../types';
import { computeRowQty, computeRowTotal, formatNum, getQtyColumnId, toNum } from '../utils/calculations';

interface CardGridViewProps {
  sheet: SheetDoc;
  filteredRows: { row: ProductRow; originalIndex: number }[];
  selectedIds: Set<string>;
  isFiltered: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateCell: (rowId: string, colId: string, value: string) => void;
  onReplaceImage: (rowId: string) => void;
  onPreviewImage: (rowId: string) => void;
  onRotateImage: (rowId: string) => void;
  onMoveRow: (originalIndex: number, dir: -1 | 1) => void;
  onDuplicateRow: (originalIndex: number) => void;
  onDeleteRow: (originalIndex: number) => void;
  onBatchUploadClick: () => void;
  onAddRow: () => void;
  onResetFilters: () => void;
}

export const CardGridView: React.FC<CardGridViewProps> = ({
  sheet,
  filteredRows,
  selectedIds,
  isFiltered,
  onToggleSelect,
  onUpdateCell,
  onReplaceImage,
  onPreviewImage,
  onRotateImage,
  onMoveRow,
  onDuplicateRow,
  onDeleteRow,
  onBatchUploadClick,
  onAddRow,
  onResetFilters,
}) => {
  const previewSize = Math.min(160, Math.max(84, sheet.cfg.imgW));
  const qtyColId = getQtyColumnId(sheet.columns);

  if (sheet.rows.length === 0) {
    return (
      <div className="no-print bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          <ImagePlus className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
          اضغط على "رفع صور" لإضافة البضائع وترتيبها
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          يمكنك اختيار صور متعددة معًا أو إضافة صف جديد يدويًا
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onBatchUploadClick}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-bold cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>رفع صور دفعة واحدة</span>
          </button>
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>صف جديد</span>
          </button>
        </div>
      </div>
    );
  }

  if (filteredRows.length === 0) {
    return (
      <div className="no-print bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          لا توجد بنود مطابقة للبحث الحالي
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          مسح الفلاتر
        </button>
      </div>
    );
  }

  return (
    <div className="no-print grid grid-cols-1 xl:grid-cols-2 gap-3.5">
      {filteredRows.map(({ row, originalIndex }) => {
        const isSelected = selectedIds.has(row.id);
        const computedTotal = computeRowTotal(row, sheet.columns);
        const computedQty = computeRowQty(row, sheet.columns);

        return (
          <div
            key={row.id}
            className={`rounded-xl border p-3.5 space-y-3 transition-colors ${
              isSelected
                ? 'bg-blue-50/70 dark:bg-blue-950/25 border-blue-400 dark:border-blue-500/60'
                : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(row.id)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  #{originalIndex + 1}
                </span>
                {row.vals.code ? (
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                    · {String(row.vals.code)}
                  </span>
                ) : null}
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isFiltered || originalIndex === 0}
                  onClick={() => onMoveRow(originalIndex, -1)}
                  title="تحريك لأعلى"
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isFiltered || originalIndex === sheet.rows.length - 1}
                  onClick={() => onMoveRow(originalIndex, 1)}
                  title="تحريك لأسفل"
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateRow(originalIndex)}
                  title="تكرار الصف"
                  className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRow(originalIndex)}
                  title="حذف الصف"
                  className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body: Image + Dynamic Inputs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div
                style={{ width: `${previewSize}px`, height: `${previewSize}px` }}
                className="group relative shrink-0 self-center sm:self-start rounded-lg bg-slate-100 dark:bg-[#090E1A] border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center"
              >
                {row.img ? (
                  <>
                    <img
                      src={row.img}
                      alt={String(row.vals.code || `بند ${originalIndex + 1}`)}
                      referrerPolicy="no-referrer"
                      onClick={() => onPreviewImage(row.id)}
                      className={`w-full h-full cursor-pointer ${
                        sheet.cfg.fit === 'stretch' ? 'object-fill' : 'object-contain'
                      }`}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-1.5 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPreviewImage(row.id)}
                        title="تكبير"
                        className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRotateImage(row.id)}
                        title="تدوير"
                        className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReplaceImage(row.id)}
                        title="تغيير الصورة"
                        className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReplaceImage(row.id)}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[11px] font-bold">اختر صورة</span>
                  </button>
                )}
              </div>

              <div className="flex-1 w-full grid grid-cols-2 gap-2 min-w-0">
                {sheet.columns.map((col) => {
                  if (col.type === 'total') {
                    return (
                      <div
                        key={col.id}
                        className="col-span-2 flex items-center justify-between rounded-lg bg-slate-100/80 dark:bg-[#090E1A] border border-slate-200 dark:border-slate-800 px-3 py-2"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {col.label}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                          {formatNum(computedTotal, 2)} {sheet.currency}
                        </span>
                      </div>
                    );
                  }

                  const rawVal = row.vals[col.id];
                  const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
                  const isNumeric = col.type !== 'text';
                  const isFullSpan = col.id === 'desc' || col.id === 'notes';
                  const isAutoQtyHint =
                    col.id === qtyColId && toNum(rawVal) === 0 && computedQty > 0;

                  return (
                    <div key={col.id} className={isFullSpan ? 'col-span-2' : ''}>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                        {col.label}
                      </label>
                      <input
                        type={isNumeric ? 'number' : 'text'}
                        step="any"
                        value={displayVal}
                        placeholder={isAutoQtyHint ? String(computedQty) : ''}
                        onChange={(e) => onUpdateCell(row.id, col.id, e.target.value)}
                        className={`w-full h-9 rounded-lg bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 ${
                          isNumeric ? 'font-mono tabular-nums font-semibold' : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
