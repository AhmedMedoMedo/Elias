import React from 'react';
import {
  FileSpreadsheet,
  Loader2,
  Menu,
  Printer,
  SlidersHorizontal,
  TableProperties,
  Upload,
} from 'lucide-react';

interface TopBarProps {
  onOpenSidebar: () => void;
  onOpenColumns: () => void;
  onOpenExcelSettings: () => void;
  onTriggerImportExcel: () => void;
  onPrint: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
  rowCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSidebar,
  onOpenColumns,
  onOpenExcelSettings,
  onTriggerImportExcel,
  onPrint,
  onExportExcel,
  isExporting,
  rowCount,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#0D1424]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800/90 px-4 lg:px-6 flex items-center justify-between gap-4 lg:gap-8">
      {/* Zone 1: Brand Wordmark (single line) */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -mr-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          نظام البضائع الصيني XL
        </span>
      </div>

      {/* Zone 2: Clean Single-Line Navigation Actions */}
      <nav
        aria-label="أدوات الجدول"
        className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300"
      >
        <button
          type="button"
          onClick={onOpenColumns}
          className="flex items-center gap-1.5 py-1 hover:text-slate-950 dark:hover:text-white border-b-2 border-transparent hover:border-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <TableProperties className="w-4 h-4 opacity-75" />
          <span>الخانات</span>
        </button>
        <button
          type="button"
          onClick={onOpenExcelSettings}
          className="flex items-center gap-1.5 py-1 hover:text-slate-950 dark:hover:text-white border-b-2 border-transparent hover:border-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 opacity-75" />
          <span>إعدادات الإكسل</span>
        </button>
        <button
          type="button"
          onClick={onTriggerImportExcel}
          className="flex items-center gap-1.5 py-1 hover:text-slate-950 dark:hover:text-white border-b-2 border-transparent hover:border-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4 opacity-75" />
          <span>استيراد Excel</span>
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={rowCount === 0}
          className="flex items-center gap-1.5 py-1 hover:text-slate-950 dark:hover:text-white border-b-2 border-transparent hover:border-blue-500 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Printer className="w-4 h-4 opacity-75" />
          <span>طباعة PDF</span>
        </button>
      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onExportExcel}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>{isExporting ? 'جاري التصدير...' : 'تصدير Excel'}</span>
        </button>
      </div>
    </header>
  );
};
