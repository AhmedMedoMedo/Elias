import React from 'react';
import {
  Copy,
  Download,
  FileSpreadsheet,
  FolderPlus,
  Moon,
  Plus,
  Printer,
  SlidersHorizontal,
  Sun,
  TableProperties,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { SheetDoc } from '../types';
import { COLUMN_TEMPLATES } from '../utils/db';
import { computeSheetTotals, formatMoney } from '../utils/calculations';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  sheets: SheetDoc[];
  activeSheetId: string;
  theme: 'dark' | 'light';
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectSheet: (id: string) => void;
  onCreateSheet: (templateId?: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onToggleTheme: () => void;
  onExportBackup: () => void;
  onTriggerRestoreBackup: () => void;
  onOpenColumns: () => void;
  onOpenExcelSettings: () => void;
  onTriggerImportExcel: () => void;
  onPrint: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sheets,
  activeSheetId,
  theme,
  isOpenMobile,
  onCloseMobile,
  onSelectSheet,
  onCreateSheet,
  onDuplicateSheet,
  onDeleteSheet,
  onToggleTheme,
  onExportBackup,
  onTriggerRestoreBackup,
  onOpenColumns,
  onOpenExcelSettings,
  onTriggerImportExcel,
  onPrint,
}) => {
  const sidebarBody = (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1424] border-l border-slate-200 dark:border-slate-800/90">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800">
        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
          القوائم والإعدادات
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sheets List Section */}
      <div className="p-4 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400">
          القوائم والشحنات ({sheets.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            onCreateSheet('basic');
            onCloseMobile();
          }}
          className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>جديدة</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const stats = computeSheetTotals(sheet);
          return (
            <div
              key={sheet.id}
              onClick={() => {
                onSelectSheet(sheet.id);
                onCloseMobile();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSheet(sheet.id);
                  onCloseMobile();
                }
              }}
              className={`group rounded-lg px-3 py-2.5 transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-200 dark:border-blue-500/40'
                  : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {sheet.title || 'قائمة بدون اسم'}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                    <span>{stats.count} بند</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{formatMoney(stats.totalMoney, sheet.currency)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-80 lg:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    title="تكرار القائمة"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSheet(sheet.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {sheets.length > 1 && (
                    <button
                      type="button"
                      title="حذف القائمة"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSheet(sheet.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Quick Tool Links (since nav is hidden on small screens) */}
        <div className="md:hidden pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="px-2 pb-1 text-[11px] font-bold text-slate-400">أدوات الجدول</div>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onOpenColumns();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <TableProperties className="w-4 h-4 text-slate-400" />
            <span>التحكم في الخانات</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onOpenExcelSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>إعدادات الصور والإكسل</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onTriggerImportExcel();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>استيراد ملف Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onPrint();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>طباعة كتالوج PDF</span>
          </button>
        </div>

        {/* Templates Section */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="px-2 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            قائمة جديدة من قالب جاهز
          </div>
          <div className="space-y-1">
            {COLUMN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onCreateSheet(tpl.id);
                  onCloseMobile();
                }}
                className="w-full text-right flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tpl.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {tpl.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Workspace Utilities */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 space-y-2">
        <PWAInstallButton />

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نسخة احتياطية</span>
          </button>
          <button
            type="button"
            onClick={onTriggerRestoreBackup}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استعادة ملف</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden lg:block w-68 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
};
