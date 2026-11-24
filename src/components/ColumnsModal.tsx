import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import type { ColumnDef, ColumnType } from '../types';
import { COLUMN_TEMPLATES, cloneColumns } from '../utils/db';

interface ColumnsModalProps {
  isOpen: boolean;
  columns: ColumnDef[];
  onChangeColumns: (next: ColumnDef[]) => void;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'total', label: 'إجمالي (الكمية×السعر)' },
  { value: 'ctn', label: 'عدد الكراتين' },
  { value: 'pcs_ctn', label: 'قطع / كرتونة' },
  { value: 'cbm', label: 'حجم CBM' },
];

export const ColumnsModal: React.FC<ColumnsModalProps> = ({
  isOpen,
  columns,
  onChangeColumns,
  onClose,
}) => {
  if (!isOpen) return null;

  const updateCol = (idx: number, patch: Partial<ColumnDef>) => {
    const next = columns.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChangeColumns(next);
  };

  const moveCol = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChangeColumns(next);
  };

  const deleteCol = (idx: number) => {
    if (columns.length <= 1) return;
    onChangeColumns(columns.filter((_, i) => i !== idx));
  };

  const addCol = () => {
    onChangeColumns([
      ...columns,
      {
        id: 'col_' + Date.now().toString(36),
        label: 'خانة ' + (columns.length + 1),
        type: 'text',
        width: 18,
      },
    ]);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              التحكم في الخانات والأعمدة
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              عدّل الأسماء، نوع البيانات، وترتيب وعرض كل عمود في ملف الإكسل
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

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Quick Templates */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
              تطبيق قالب أعمدة جاهز على القائمة الحالية:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {COLUMN_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onChangeColumns(cloneColumns(tpl.columns))}
                  className="text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090E1A] hover:border-blue-500/60 px-3 py-2 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {tpl.name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Columns List */}
          <div className="space-y-2">
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-400">
              <div className="col-span-4">اسم العمود</div>
              <div className="col-span-4">النوع</div>
              <div className="col-span-2 text-center">العرض (Excel)</div>
              <div className="col-span-2 text-center">إجراء</div>
            </div>

            {columns.map((col, idx) => (
              <div
                key={col.id}
                className="grid grid-cols-12 gap-2 items-center rounded-lg bg-slate-50 dark:bg-[#090E1A] border border-slate-200 dark:border-slate-800 p-2"
              >
                <div className="col-span-12 sm:col-span-4">
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => updateCol(idx, { label: e.target.value })}
                    className="w-full h-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <select
                    value={col.type}
                    onChange={(e) => updateCol(idx, { type: e.target.value as ColumnType })}
                    className="w-full h-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    min={8}
                    max={60}
                    value={col.width || 16}
                    onChange={(e) =>
                      updateCol(idx, { width: Math.max(8, parseInt(e.target.value, 10) || 16) })
                    }
                    title="عرض العمود في الإكسل"
                    className="w-full h-8 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveCol(idx, -1)}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="أعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === columns.length - 1}
                    onClick={() => moveCol(idx, 1)}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="أسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={columns.length <= 1}
                    onClick={() => deleteCol(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={addCol}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة خانة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
