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
import type { ColumnDef, ImageFitMode, ProductRow, SheetDoc } from '../types';
import { computeRowQty, computeRowTotal, formatNum, getQtyColumnId, toNum } from '../utils/calculations';

interface DataTableViewProps {
  sheet: SheetDoc;
  filteredRows: { row: ProductRow; originalIndex: number }[];
  selectedIds: Set<string>;
  isFiltered: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
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

export const DataTableView: React.FC<DataTableViewProps> = ({
  sheet,
  filteredRows,
  selectedIds,
  isFiltered,
  onToggleSelect,
  onToggleSelectAll,
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
  const thumbSize = Math.min(110, Math.max(56, Math.round(sheet.cfg.imgW * 0.65)));
  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every(({ row }) => selectedIds.has(row.id));

  const qtyColId = getQtyColumnId(sheet.columns);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = document.querySelector<HTMLInputElement>(
        `input[data-grid-row="${rowIdx + 1}"][data-grid-col="${colId}"]`
      );
      if (next) {
        next.focus();
        next.select();
      }
    }
  };

  if (sheet.rows.length === 0) {
    return (
      <div className="no-print bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          <ImagePlus className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          ابدأ بإضافة صور البضائع أو اسحبها وأفلتها هنا
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          يمكنك رفع عشرات الصور دفعة واحدة، وسيتم ضغطها تلقائيًا وتجهيزها في الجدول بأسماء الملفات لتصديرها في ملف Excel جاهز بالمعادلات.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onBatchUploadClick}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>رفع صور دفعة واحدة</span>
          </button>
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صف يدوي</span>
          </button>
        </div>
      </div>
    );
  }

  if (filteredRows.length === 0) {
    return (
      <div className="no-print bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          لا توجد بنود مطابقة لخيارات البحث أو الفلترة الحالية
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          مسح البحث والفلاتر
        </button>
      </div>
    );
  }

  const getColMinWidth = (col: ColumnDef): string => {
    if (col.id === 'desc') return 'min-w-[200px]';
    if (col.type === 'text') return 'min-w-[130px]';
    if (col.type === 'total') return 'min-w-[115px]';
    return 'min-w-[96px]';
  };

  const renderFitClass = (fit: ImageFitMode) => (fit === 'stretch' ? 'object-fill' : 'object-contain');

  return (
    <div className="no-print bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="bg-slate-100 dark:bg-[#0D1424] border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="تحديد الكل"
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="w-10 px-2 py-3 text-center font-mono">#</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">الصورة</th>
              {sheet.columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-2.5 py-3 whitespace-nowrap ${getColMinWidth(col)} ${
                    col.type === 'text' ? 'text-right' : 'text-center'
                  }`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-28 px-3 py-3 text-center whitespace-nowrap">إجراءات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {filteredRows.map(({ row, originalIndex }, visibleIdx) => {
              const isSelected = selectedIds.has(row.id);
              const computedTotal = computeRowTotal(row, sheet.columns);
              const computedQty = computeRowQty(row, sheet.columns);

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/25'
                      : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/35'
                  }`}
                >
                  <td className="px-3 py-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(row.id)}
                      aria-label={`تحديد صف ${originalIndex + 1}`}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                  </td>

                  <td className="px-2 py-2 text-center align-middle font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                    {originalIndex + 1}
                  </td>

                  {/* Photo Thumbnail Cell */}
                  <td className="px-3 py-2 align-middle">
                    <div
                      style={{ width: `${thumbSize}px`, height: `${thumbSize}px` }}
                      className="group relative mx-auto rounded-lg bg-slate-100 dark:bg-[#090E1A] border border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center"
                    >
                      {row.img ? (
                        <>
                          <img
                            src={row.img}
                            alt={String(row.vals.code || `بند ${originalIndex + 1}`)}
                            referrerPolicy="no-referrer"
                            onClick={() => onPreviewImage(row.id)}
                            className={`w-full h-full cursor-pointer ${renderFitClass(sheet.cfg.fit)}`}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onPreviewImage(row.id)}
                              title="تكبير الصورة"
                              className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                            >
                              <ZoomIn className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRotateImage(row.id)}
                              title="تدوير 90 درجة"
                              className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onReplaceImage(row.id)}
                              title="تغيير الصورة"
                              className="p-1 rounded bg-white/20 hover:bg-white/35 text-white cursor-pointer"
                            >
                              <ImagePlus className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onReplaceImage(row.id)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="w-4 h-4" />
                          <span className="text-[10px] font-bold">إضافة</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Dynamic Data Cells */}
                  {sheet.columns.map((col) => {
                    if (col.type === 'total') {
                      return (
                        <td key={col.id} className="px-2.5 py-2 align-middle text-center">
                          <div className="font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatNum(computedTotal, 2)}
                          </div>
                        </td>
                      );
                    }

                    const rawVal = row.vals[col.id];
                    const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
                    const isNumeric = col.type !== 'text';
                    const isAutoQtyHint =
                      col.id === qtyColId && toNum(rawVal) === 0 && computedQty > 0;

                    return (
                      <td key={col.id} className="px-2 py-2 align-middle">
                        <input
                          type={isNumeric ? 'number' : 'text'}
                          step="any"
                          data-grid-row={visibleIdx}
                          data-grid-col={col.id}
                          value={displayVal}
                          placeholder={isAutoQtyHint ? String(computedQty) : ''}
                          onChange={(e) => onUpdateCell(row.id, col.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, visibleIdx, col.id)}
                          className={`w-full h-9 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 bg-slate-50/70 dark:bg-[#090E1A]/80 focus:bg-white dark:focus:bg-[#090E1A] px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors ${
                            isNumeric ? 'font-mono text-center tabular-nums font-semibold' : 'text-right'
                          }`}
                        />
                      </td>
                    );
                  })}

                  {/* Row Actions */}
                  <td className="px-2.5 py-2 align-middle">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        disabled={isFiltered || originalIndex === 0}
                        onClick={() => onMoveRow(originalIndex, -1)}
                        title="تحريك لأعلى"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isFiltered || originalIndex === sheet.rows.length - 1}
                        onClick={() => onMoveRow(originalIndex, 1)}
                        title="تحريك لأسفل"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateRow(originalIndex)}
                        title="تكرار الصف"
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRow(originalIndex)}
                        title="حذف الصف"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
