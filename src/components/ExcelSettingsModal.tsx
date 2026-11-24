import React from 'react';
import { X } from 'lucide-react';
import type { ExcelConfig, ImageFitMode } from '../types';
import { HEADER_COLORS } from '../utils/db';

interface ExcelSettingsModalProps {
  isOpen: boolean;
  cfg: ExcelConfig;
  onChangeCfg: (next: ExcelConfig) => void;
  onClose: () => void;
}

export const ExcelSettingsModal: React.FC<ExcelSettingsModalProps> = ({
  isOpen,
  cfg,
  onChangeCfg,
  onClose,
}) => {
  if (!isOpen) return null;

  const update = (patch: Partial<ExcelConfig>) => {
    onChangeCfg({ ...cfg, ...patch });
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              إعدادات الصور وتنسيق الإكسل
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تحكم دقيق في مقاسات الصور، المعادلات، والألوان داخل ملف (.xlsx)
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
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Dimensions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                عرض الصورة بالإكسل (px)
              </label>
              <input
                type="number"
                min={40}
                max={400}
                value={cfg.imgW}
                onChange={(e) => update({ imgW: Math.max(40, parseInt(e.target.value, 10) || 130) })}
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ارتفاع الصورة بالإكسل (px)
              </label>
              <input
                type="number"
                min={40}
                max={400}
                value={cfg.imgH}
                onChange={(e) => update({ imgH: Math.max(40, parseInt(e.target.value, 10) || 115) })}
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ارتفاع الصف بالإكسل (pt)
              </label>
              <input
                type="number"
                min={40}
                max={350}
                value={cfg.rowH}
                onChange={(e) => update({ rowH: Math.max(40, parseInt(e.target.value, 10) || 105) })}
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                عرض عمود الصورة
              </label>
              <input
                type="number"
                min={12}
                max={60}
                value={cfg.colW}
                onChange={(e) => update({ colW: Math.max(12, parseInt(e.target.value, 10) || 24) })}
                className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Image Fit Mode */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              طريقة احتواء الصورة داخل الخلية
            </label>
            <select
              value={cfg.fit}
              onChange={(e) => update({ fit: e.target.value as ImageFitMode })}
              className="w-full h-9 bg-slate-50 dark:bg-[#090E1A] border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="contain">الحفاظ على الأبعاد الأصلية (موصى به)</option>
              <option value="stretch">تمديد لملء كامل مقاس الخلية</option>
            </select>
          </div>

          {/* Header Color Swatches */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-2">
              لون ترويسة ملف الإكسل
            </label>
            <div className="grid grid-cols-5 gap-2">
              {HEADER_COLORS.map((c) => {
                const active = cfg.color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update({ color: c.value })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-md border border-white/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Excel Export Toggles */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  معادلات إكسل حية (Formulas)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  تضمين معادلات الضرب والجمع التلقائي (SUM) لتحديث الأرقام عند التعديل داخل Excel
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.useFormulas}
                onChange={(e) => update({ useFormulas: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mr-3"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  اتجاه الورقة من اليمين لليسار (RTL)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  تناسب الجداول العربية عند فتح الملف في Microsoft Excel
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.rtlSheet}
                onChange={(e) => update({ rtlSheet: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mr-3"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  صف الإجمالي النهائي أسفل الجدول
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  إضافة صف ملون بمجموع الكميات والكراتين والإجمالي المالي
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.includeTotalsRow}
                onChange={(e) => update({ includeTotalsRow: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mr-3"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  تضمين شريط بيانات المورد والشحنة
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  عرض اسم المورد ورقم الشحنة والتاريخ والعملة أسفل العنوان الرئيسي
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.includeMetaRow}
                onChange={(e) => update({ includeMetaRow: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mr-3"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  تظليل الصفوف بالتبادل (Zebra Stripes)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  تمييز بصري خفيف بين الصفوف لتسهيل المراجعة والطباعة
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.zebraStripes}
                onChange={(e) => update({ zebraStripes: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mr-3"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
