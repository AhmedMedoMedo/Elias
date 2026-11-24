import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  LayoutGrid,
  PencilLine,
  Plus,
  Search,
  Table2,
  Trash2,
} from 'lucide-react';
import type { CurrencyCode, SheetDoc, SheetTotals } from '../types';
import { formatMoney, formatNum } from '../utils/calculations';

export type ImageFilterMode = 'all' | 'with_img' | 'without_img';

interface WorkspaceToolbarProps {
  sheet: SheetDoc;
  totals: SheetTotals;
  viewMode: 'table' | 'cards';
  searchQuery: string;
  imageFilter: ImageFilterMode;
  selectedCount: number;
  savedLabel: string;
  onUpdateSheet: (updater: (prev: SheetDoc) => SheetDoc) => void;
  onChangeViewMode: (mode: 'table' | 'cards') => void;
  onSearchChange: (q: string) => void;
  onImageFilterChange: (f: ImageFilterMode) => void;
  onBatchUploadClick: () => void;
  onAddRow: () => void;
  onQuickSizeChange: (px: number) => void;
  onClearAllRows: () => void;
  onOpenBulkEdit: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'RMB', label: 'RMB (يوان صيني)' },
  { value: 'USD', label: 'USD (دولار أمريكي)' },
  { value: 'EGP', label: 'EGP (جنيه مصري)' },
  { value: 'SAR', label: 'SAR (ريال سعودي)' },
  { value: 'AED', label: 'AED (درهم إماراتي)' },
  { value: '', label: 'بدون عملة' },
];

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  sheet,
  totals,
  viewMode,
  searchQuery,
  imageFilter,
  selectedCount,
  savedLabel,
  onUpdateSheet,
  onChangeViewMode,
  onSearchChange,
  onImageFilterChange,
  onBatchUploadClick,
  onAddRow,
  onQuickSizeChange,
  onClearAllRows,
  onOpenBulkEdit,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="no-print space-y-4">
      {/* Sheet Title & Primary Metadata Row */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="sheet-title-input"
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                اسم القائمة / ملف الإكسل
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {savedLabel}
              </span>
            </div>
            <input
              id="sheet-title-input"
              type="text"
              value={sheet.title}
              onChange={(e) =>
                onUpdateSheet((s) => ({ ...s, title: e.target.value, updatedAt: Date.now() }))
              }
              placeholder="مثال: شحنة إكسسوارات ييوو - نوفمبر"
              className="w-full h-10 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="sheet-currency-select"
              className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1"
            >
              العملة الأساسية
            </label>
            <select
              id="sheet-currency-select"
              value={sheet.currency}
              onChange={(e) =>
                onUpdateSheet((s) => ({
                  ...s,
                  currency: e.target.value as CurrencyCode,
                  updatedAt: Date.now(),
                }))
              }
              className="w-full h-10 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                showDetails || sheet.exchange.enabled || sheet.meta.supplier
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#090E1A] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate">بيانات المورد وسعر الصرف</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Supplier Metadata & Exchange Rate Panel */}
        {showDetails && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  اسم المورد / المصنع
                </label>
                <input
                  type="text"
                  value={sheet.meta.supplier}
                  onChange={(e) =>
                    onUpdateSheet((s) => ({
                      ...s,
                      meta: { ...s.meta, supplier: e.target.value },
                    }))
                  }
                  placeholder="Yiwu Trade Co."
                  className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  رقم الشحنة / الفاتورة
                </label>
                <input
                  type="text"
                  value={sheet.meta.shipmentNo}
                  onChange={(e) =>
                    onUpdateSheet((s) => ({
                      ...s,
                      meta: { ...s.meta, shipmentNo: e.target.value },
                    }))
                  }
                  placeholder="INV-2026-01"
                  className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  تاريخ القائمة
                </label>
                <input
                  type="date"
                  value={sheet.meta.date}
                  onChange={(e) =>
                    onUpdateSheet((s) => ({
                      ...s,
                      meta: { ...s.meta, date: e.target.value },
                    }))
                  }
                  className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  ملاحظات الشحنة
                </label>
                <input
                  type="text"
                  value={sheet.meta.notes}
                  onChange={(e) =>
                    onUpdateSheet((s) => ({
                      ...s,
                      meta: { ...s.meta, notes: e.target.value },
                    }))
                  }
                  placeholder="شحن بحري - تسليم المخزن"
                  className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Exchange Rate Converter Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sheet.exchange.enabled}
                  onChange={(e) =>
                    onUpdateSheet((s) => ({
                      ...s,
                      exchange: { ...s.exchange, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                <span>حساب المعادل بعملة أخرى</span>
              </label>

              {sheet.exchange.enabled && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    1 {sheet.currency || 'وحدة'} =
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sheet.exchange.rate}
                    onChange={(e) =>
                      onUpdateSheet((s) => ({
                        ...s,
                        exchange: {
                          ...s.exchange,
                          rate: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-24 h-8 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={sheet.exchange.targetCurrency}
                    onChange={(e) =>
                      onUpdateSheet((s) => ({
                        ...s,
                        exchange: {
                          ...s.exchange,
                          targetCurrency: e.target.value as Exclude<CurrencyCode, ''>,
                        },
                      }))
                    }
                    className="h-8 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-md px-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="RMB">RMB</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary KPI Metrics Strip (Flat hairline dividers, no card-within-card) */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 dark:divide-slate-800 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="py-1.5 md:px-4 first:md:pr-0">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              عدد البنود
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatNum(totals.count, 0)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                {totals.withImages} بصورة
              </span>
            </div>
          </div>

          <div className="py-1.5 md:px-4">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              إجمالي الكمية
            </div>
            <div className="mt-0.5 text-lg font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatNum(totals.totalQty, 0)}
            </div>
          </div>

          <div className="py-1.5 md:px-4">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {totals.hasCartons || totals.hasCbm ? 'الكراتين / الحجم' : 'مقاس الصور بالإكسل'}
            </div>
            {totals.hasCartons || totals.hasCbm ? (
              <div className="mt-0.5 flex items-baseline gap-2 font-mono tabular-nums">
                {totals.hasCartons && (
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {formatNum(totals.totalCartons, 0)} CTN
                  </span>
                )}
                {totals.hasCbm && (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {formatNum(totals.totalCbm, 3)} CBM
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-0.5 text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {sheet.cfg.imgW} × {sheet.cfg.imgH}
              </div>
            )}
          </div>

          <div className="py-1.5 md:px-4 last:md:pl-0">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              الإجمالي المالي
            </div>
            <div className="mt-0.5 flex flex-col">
              <span className="text-lg font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 truncate">
                {formatMoney(totals.totalMoney, sheet.currency)}
              </span>
              {totals.convertedMoney !== null && (
                <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  ≈ {formatMoney(totals.convertedMoney, sheet.exchange.targetCurrency)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Right side: Primary creation actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBatchUploadClick}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>رفع صور دفعة واحدة</span>
          </button>

          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>صف جديد</span>
          </button>

          {sheet.rows.length > 0 && (
            <button
              type="button"
              onClick={onClearAllRows}
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح الكل</span>
            </button>
          )}
        </div>

        {/* Left side: Search, Filter, Quick Photo Size & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] sm:w-52">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="بحث بالكود أو الوصف..."
              className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-lg pr-9 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Image Filter Segmented Control */}
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'with_img', label: 'بصورة' },
                { id: 'without_img', label: 'بدون صورة' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onImageFilterChange(opt.id)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  imageFilter === opt.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Quick Photo Size Slider */}
          <div className="hidden sm:flex items-center gap-2 h-10 px-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              الصورة:
            </span>
            <input
              type="range"
              min={70}
              max={220}
              step={10}
              value={sheet.cfg.imgW}
              onChange={(e) => onQuickSizeChange(parseInt(e.target.value, 10))}
              className="w-20 accent-blue-600 cursor-pointer"
              aria-label="مقاس الصورة"
            />
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 w-10 text-left tabular-nums">
              {sheet.cfg.imgW}px
            </span>
          </div>

          {/* View Mode Segmented Switch */}
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="عرض الجدول"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>جدول</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>بطاقات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contextual Bulk Selection Toolbar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-600 text-white px-4 py-2.5">
          <div className="text-xs sm:text-sm font-bold">
            تم تحديد <span className="font-mono tabular-nums">{selectedCount}</span> صف
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenBulkEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              <PencilLine className="w-3.5 h-3.5" />
              <span>تعديل جماعي / نسبة سعر</span>
            </button>
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>تكرار</span>
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحدد</span>
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
