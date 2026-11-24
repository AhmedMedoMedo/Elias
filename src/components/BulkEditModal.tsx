import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ColumnDef } from '../types';

export type BulkEditPayload =
  | { mode: 'price_percent'; colId: string; percent: number }
  | { mode: 'price_multiply'; colId: string; factor: number }
  | { mode: 'set_value'; colId: string; value: string };

interface BulkEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  columns: ColumnDef[];
  onApply: (payload: BulkEditPayload) => void;
  onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  selectedCount,
  columns,
  onApply,
  onClose,
}) => {
  const editableCols = columns.filter((c) => c.type !== 'total');
  const numericCols = editableCols.filter((c) => c.type !== 'text');
  const defaultNumCol =
    numericCols.find((c) => c.id === 'price')?.id || numericCols[0]?.id || editableCols[0]?.id || '';

  const [mode, setMode] = useState<'price_percent' | 'price_multiply' | 'set_value'>('price_percent');
  const [colId, setColId] = useState<string>(defaultNumCol);
  const [percent, setPercent] = useState<string>('15');
  const [factor, setFactor] = useState<string>('1.1');
  const [fixedVal, setFixedVal] = useState<string>('');

  if (!isOpen) return null;

  const targetColId =
    mode === 'set_value'
      ? editableCols.some((c) => c.id === colId)
        ? colId
        : editableCols[0]?.id || ''
      : numericCols.some((c) => c.id === colId)
        ? colId
        : defaultNumCol;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColId) return;
    if (mode === 'price_percent') {
      onApply({ mode: 'price_percent', colId: targetColId, percent: parseFloat(percent) || 0 });
    } else if (mode === 'price_multiply') {
      onApply({ mode: 'price_multiply', colId: targetColId, factor: parseFloat(factor) || 1 });
    } else {
      onApply({ mode: 'set_value', colId: targetColId, value: fixedVal });
    }
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              تعديل جماعي ({selectedCount} صف محدد)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              عدّل الأسعار بنسب مئوية أو حدّث أي عمود لكل الصفوف المحددة دفعة واحدة
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

        <div className="p-4 space-y-4 text-xs">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#090E1A]">
            <button
              type="button"
              onClick={() => setMode('price_percent')}
              className={`py-2 rounded-md font-bold transition-colors cursor-pointer ${
                mode === 'price_percent'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              نسبة مئوية %
            </button>
            <button
              type="button"
              onClick={() => setMode('price_multiply')}
              className={`py-2 rounded-md font-bold transition-colors cursor-pointer ${
                mode === 'price_multiply'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ضرب في معامل
            </button>
            <button
              type="button"
              onClick={() => setMode('set_value')}
              className={`py-2 rounded-md font-bold transition-colors cursor-pointer ${
                mode === 'set_value'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              قيمة ثابتة
            </button>
          </div>

          {/* Column Picker */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              العمود المستهدف
            </label>
            <select
              value={targetColId}
              onChange={(e) => setColId(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {(mode === 'set_value' ? editableCols : numericCols).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Input */}
          {mode === 'price_percent' && (
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                النسبة المئوية (موجب للزيادة مثل 15، سالب للخصم مثل -10)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="flex-1 h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <span className="font-mono font-bold text-slate-500">%</span>
              </div>
            </div>
          )}

          {mode === 'price_multiply' && (
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                معامل الضرب (مثال: 6.9 لتحويل الأسعار من يوان لجنيه)
              </label>
              <input
                type="number"
                step="any"
                value={factor}
                onChange={(e) => setFactor(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {mode === 'set_value' && (
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                القيمة الجديدة لكل الصفوف المحددة
              </label>
              <input
                type="text"
                value={fixedVal}
                onChange={(e) => setFixedVal(e.target.value)}
                placeholder="أدخل القيمة..."
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold cursor-pointer"
          >
            تطبيق التعديل
          </button>
        </div>
      </form>
    </div>
  );
};
