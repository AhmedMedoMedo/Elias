/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { saveAs } from 'file-saver';
import type { ProductRow, SheetDoc, ToastItem, WorkspaceState } from './types';
import {
  createDefaultWorkspace,
  createNewSheet,
  loadWorkspace,
  saveWorkspace,
} from './utils/db';
import {
  computeSheetTotals,
  getQtyColumnId,
  toNum,
} from './utils/calculations';
import { compressImageFile, rotateDataUrl, stripFileExtension } from './utils/image';
import { exportSheetToExcel, importExcelFile } from './utils/excel';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { WorkspaceToolbar, type ImageFilterMode } from './components/WorkspaceToolbar';
import { DataTableView } from './components/DataTableView';
import { CardGridView } from './components/CardGridView';
import { ColumnsModal } from './components/ColumnsModal';
import { ExcelSettingsModal } from './components/ExcelSettingsModal';
import { BulkEditModal, type BulkEditPayload } from './components/BulkEditModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { ConfirmModal, ToastStack } from './components/ConfirmModal';
import { PrintCatalogView } from './components/PrintCatalogView';
import { OfflineIndicator } from './components/OfflineIndicator';

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(createDefaultWorkspace);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedLabel, setSavedLabel] = useState('جاري التحميل...');

  // UI state
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [colsModalOpen, setColsModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [previewRowId, setPreviewRowId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Filtering & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFilter, setImageFilter] = useState<ImageFilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Export & Drag-Drop status
  const [isExporting, setIsExporting] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Hidden file inputs
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const singleImgInputRef = useRef<HTMLInputElement | null>(null);
  const excelImportInputRef = useRef<HTMLInputElement | null>(null);
  const backupRestoreInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<string | null>(null);
  const dragCounterRef = useRef(0);

  const pushToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Load workspace from IndexedDB on mount
  useEffect(() => {
    let active = true;
    loadWorkspace().then((loaded) => {
      if (!active) return;
      setWorkspace(loaded);
      setIsLoaded(true);
      setSavedLabel('محفوظ محليًا');
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync HTML .dark class with theme state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', workspace.theme === 'dark');
  }, [workspace.theme]);

  // Auto-save to IndexedDB whenever workspace changes
  useEffect(() => {
    if (!isLoaded) return;
    setSavedLabel('جاري الحفظ...');
    const timer = window.setTimeout(() => {
      saveWorkspace(workspace)
        .then(() => {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          setSavedLabel(`تم الحفظ ${hh}:${mm}`);
        })
        .catch(() => {
          setSavedLabel('تعذر الحفظ المحلي');
        });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [workspace, isLoaded]);

  const activeSheet = useMemo(() => {
    return (
      workspace.sheets.find((s) => s.id === workspace.activeSheetId) ||
      workspace.sheets[0]
    );
  }, [workspace.sheets, workspace.activeSheetId]);

  const totals = useMemo(() => computeSheetTotals(activeSheet), [activeSheet]);

  const updateActiveSheet = useCallback((updater: (prev: SheetDoc) => SheetDoc) => {
    setWorkspace((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) =>
        s.id === prev.activeSheetId ? updater(s) : s
      ),
    }));
  }, []);

  // Clear selection when switching sheets
  const handleSelectSheet = useCallback((id: string) => {
    setWorkspace((prev) => ({ ...prev, activeSheetId: id }));
    setSelectedIds(new Set());
    setSearchQuery('');
    setImageFilter('all');
  }, []);

  const handleCreateSheet = useCallback(
    (templateId = 'basic') => {
      const nextIndex = workspace.sheets.length + 1;
      const newSheet = createNewSheet(`قائمة بضائع #${nextIndex}`, templateId);
      setWorkspace((prev) => ({
        ...prev,
        activeSheetId: newSheet.id,
        sheets: [newSheet, ...prev.sheets],
      }));
      setSelectedIds(new Set());
      setSearchQuery('');
      setImageFilter('all');
      pushToast('success', 'تم إنشاء قائمة جديدة');
    },
    [workspace.sheets.length, pushToast]
  );

  const handleDuplicateSheet = useCallback(
    (id: string) => {
      const target = workspace.sheets.find((s) => s.id === id);
      if (!target) return;
      const copy: SheetDoc = {
        ...target,
        id: 'sheet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        title: `${target.title} (نسخة)`,
        columns: target.columns.map((c) => ({ ...c })),
        rows: target.rows.map((r) => ({
          ...r,
          id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          vals: { ...r.vals },
        })),
        updatedAt: Date.now(),
      };
      setWorkspace((prev) => ({
        ...prev,
        activeSheetId: copy.id,
        sheets: [copy, ...prev.sheets],
      }));
      setSelectedIds(new Set());
      pushToast('success', 'تم تكرار القائمة بنجاح');
    },
    [workspace.sheets, pushToast]
  );

  const handleDeleteSheet = useCallback(
    (id: string) => {
      if (workspace.sheets.length <= 1) return;
      const target = workspace.sheets.find((s) => s.id === id);
      setConfirmState({
        title: 'حذف القائمة نهائيًا؟',
        description: `سيتم حذف القائمة "${target?.title || 'بدون اسم'}" وجميع صورها وصفوفها ولا يمكن التراجع.`,
        confirmLabel: 'حذف القائمة',
        onConfirm: () => {
          setWorkspace((prev) => {
            const remaining = prev.sheets.filter((s) => s.id !== id);
            return {
              ...prev,
              activeSheetId:
                prev.activeSheetId === id ? remaining[0].id : prev.activeSheetId,
              sheets: remaining,
            };
          });
          setSelectedIds(new Set());
          setConfirmState(null);
          pushToast('info', 'تم حذف القائمة');
        },
      });
    },
    [workspace.sheets, pushToast]
  );

  // Batch image processing (from file picker or drag-and-drop)
  const ingestImageFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        pushToast('error', 'لم يتم العثور على ملفات صور صالحة');
        return;
      }
      const addedRows: ProductRow[] = [];
      for (const file of imageFiles) {
        try {
          const processed = await compressImageFile(file);
          addedRows.push({
            id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            img: processed.url,
            w: processed.w,
            h: processed.h,
            vals: {
              code: stripFileExtension(file.name),
              desc: '',
              qty: 1,
              price: 0,
            },
          });
        } catch {
          // Skip unreadable image file
        }
      }
      if (addedRows.length > 0) {
        updateActiveSheet((s) => ({
          ...s,
          rows: [...s.rows, ...addedRows],
          updatedAt: Date.now(),
        }));
        pushToast('success', `تمت إضافة ${addedRows.length} صورة بنجاح`);
      }
    },
    [updateActiveSheet, pushToast]
  );

  const handleBatchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 0) {
      await ingestImageFiles(files);
    }
  };

  const handleAddRow = useCallback(() => {
    updateActiveSheet((s) => {
      const n = s.rows.length + 1;
      const newRow: ProductRow = {
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        img: null,
        w: 0,
        h: 0,
        vals: {
          code: `P-${n}`,
          desc: '',
          qty: 1,
          price: 0,
        },
      };
      return {
        ...s,
        rows: [...s.rows, newRow],
        updatedAt: Date.now(),
      };
    });
  }, [updateActiveSheet]);

  const handleUpdateCell = useCallback(
    (rowId: string, colId: string, value: string) => {
      updateActiveSheet((s) => {
        const editedCol = s.columns.find((c) => c.id === colId);
        const qtyColId = getQtyColumnId(s.columns);
        const ctnCol = s.columns.find((c) => c.type === 'ctn');
        const pcsCol = s.columns.find((c) => c.type === 'pcs_ctn');

        return {
          ...s,
          updatedAt: Date.now(),
          rows: s.rows.map((r) => {
            if (r.id !== rowId) return r;
            const nextVals: Record<string, string | number> = {
              ...r.vals,
              [colId]: value,
            };

            // Smart auto-calculate total quantity when editing cartons or pcs/ctn
            if (
              (editedCol?.type === 'ctn' || editedCol?.type === 'pcs_ctn') &&
              ctnCol &&
              pcsCol
            ) {
              const ctn = toNum(nextVals[ctnCol.id]);
              const pcs = toNum(nextVals[pcsCol.id]);
              if (ctn > 0 && pcs > 0 && s.columns.some((c) => c.id === qtyColId)) {
                nextVals[qtyColId] = ctn * pcs;
              }
            }

            return { ...r, vals: nextVals };
          }),
        };
      });
    },
    [updateActiveSheet]
  );

  const handleTriggerReplaceImage = useCallback((rowId: string) => {
    replaceTargetIdRef.current = rowId;
    singleImgInputRef.current?.click();
  }, []);

  const handleSingleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const targetId = replaceTargetIdRef.current;
    replaceTargetIdRef.current = null;
    if (!file || !targetId) return;
    try {
      const processed = await compressImageFile(file);
      updateActiveSheet((s) => ({
        ...s,
        updatedAt: Date.now(),
        rows: s.rows.map((r) =>
          r.id === targetId
            ? { ...r, img: processed.url, w: processed.w, h: processed.h }
            : r
        ),
      }));
      pushToast('success', 'تم تحديث الصورة');
    } catch {
      pushToast('error', 'تعذر معالجة الصورة المختارة');
    }
  };

  const handleRotateImage = useCallback(
    async (rowId: string) => {
      const row = activeSheet.rows.find((r) => r.id === rowId);
      if (!row?.img) return;
      try {
        const rotated = await rotateDataUrl(row.img, 90);
        updateActiveSheet((s) => ({
          ...s,
          updatedAt: Date.now(),
          rows: s.rows.map((r) =>
            r.id === rowId ? { ...r, img: rotated.url, w: rotated.w, h: rotated.h } : r
          ),
        }));
      } catch {
        pushToast('error', 'تعذر تدوير الصورة');
      }
    },
    [activeSheet.rows, updateActiveSheet, pushToast]
  );

  const handleRemoveImage = useCallback(
    (rowId: string) => {
      updateActiveSheet((s) => ({
        ...s,
        updatedAt: Date.now(),
        rows: s.rows.map((r) =>
          r.id === rowId ? { ...r, img: null, w: 0, h: 0 } : r
        ),
      }));
      pushToast('info', 'تمت إزالة الصورة من الصف');
    },
    [updateActiveSheet, pushToast]
  );

  const handleMoveRow = useCallback(
    (originalIndex: number, dir: -1 | 1) => {
      updateActiveSheet((s) => {
        const target = originalIndex + dir;
        if (target < 0 || target >= s.rows.length) return s;
        const next = [...s.rows];
        [next[originalIndex], next[target]] = [next[target], next[originalIndex]];
        return { ...s, rows: next, updatedAt: Date.now() };
      });
    },
    [updateActiveSheet]
  );

  const handleDuplicateRow = useCallback(
    (originalIndex: number) => {
      updateActiveSheet((s) => {
        const src = s.rows[originalIndex];
        if (!src) return s;
        const copy: ProductRow = {
          ...src,
          id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          vals: { ...src.vals },
        };
        const next = [...s.rows];
        next.splice(originalIndex + 1, 0, copy);
        return { ...s, rows: next, updatedAt: Date.now() };
      });
      pushToast('success', 'تم تكرار الصف');
    },
    [updateActiveSheet, pushToast]
  );

  const handleDeleteRow = useCallback(
    (originalIndex: number) => {
      updateActiveSheet((s) => {
        const target = s.rows[originalIndex];
        if (target) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(target.id);
            return next;
          });
        }
        return {
          ...s,
          rows: s.rows.filter((_, idx) => idx !== originalIndex),
          updatedAt: Date.now(),
        };
      });
    },
    [updateActiveSheet]
  );

  const handleClearAllRows = useCallback(() => {
    if (activeSheet.rows.length === 0) return;
    setConfirmState({
      title: 'مسح جميع الصفوف؟',
      description: `سيتم مسح جميع البنود (${activeSheet.rows.length} بند) من القائمة الحالية.`,
      confirmLabel: 'مسح الكل',
      onConfirm: () => {
        updateActiveSheet((s) => ({ ...s, rows: [], updatedAt: Date.now() }));
        setSelectedIds(new Set());
        setConfirmState(null);
        pushToast('info', 'تم مسح جميع الصفوف');
      },
    });
  }, [activeSheet.rows.length, updateActiveSheet, pushToast]);

  const handleQuickSizeChange = useCallback(
    (imgW: number) => {
      const imgH = Math.round(imgW * 0.86);
      const rowH = Math.round(imgH * 0.85) + 12;
      const colW = Math.max(16, Math.round(imgW / 5.5));
      updateActiveSheet((s) => ({
        ...s,
        cfg: { ...s.cfg, imgW, imgH, rowH, colW },
        updatedAt: Date.now(),
      }));
    },
    [updateActiveSheet]
  );

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeSheet.rows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => {
        if (imageFilter === 'with_img' && !row.img) return false;
        if (imageFilter === 'without_img' && row.img) return false;
        if (!q) return true;
        return Object.values(row.vals).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        );
      });
  }, [activeSheet.rows, searchQuery, imageFilter]);

  const isFiltered = searchQuery.trim().length > 0 || imageFilter !== 'all';

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const allVisibleSelected =
      filteredRows.length > 0 && filteredRows.every(({ row }) => selectedIds.has(row.id));
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(({ row }) => row.id)));
    }
  }, [filteredRows, selectedIds]);

  const handleBulkEditApply = useCallback(
    (payload: BulkEditPayload) => {
      updateActiveSheet((s) => ({
        ...s,
        updatedAt: Date.now(),
        rows: s.rows.map((r) => {
          if (!selectedIds.has(r.id)) return r;
          const nextVals = { ...r.vals };
          if (payload.mode === 'price_percent') {
            const current = toNum(nextVals[payload.colId]);
            const updated = Number((current * (1 + payload.percent / 100)).toFixed(2));
            nextVals[payload.colId] = updated;
          } else if (payload.mode === 'price_multiply') {
            const current = toNum(nextVals[payload.colId]);
            const updated = Number((current * payload.factor).toFixed(2));
            nextVals[payload.colId] = updated;
          } else {
            nextVals[payload.colId] = payload.value;
          }
          return { ...r, vals: nextVals };
        }),
      }));
      pushToast('success', `تم تحديث ${selectedIds.size} صف بنجاح`);
    },
    [selectedIds, updateActiveSheet, pushToast]
  );

  const handleDuplicateSelected = useCallback(() => {
    updateActiveSheet((s) => {
      const copies: ProductRow[] = s.rows
        .filter((r) => selectedIds.has(r.id))
        .map((r) => ({
          ...r,
          id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          vals: { ...r.vals },
        }));
      return { ...s, rows: [...s.rows, ...copies], updatedAt: Date.now() };
    });
    pushToast('success', `تم تكرار ${selectedIds.size} صف`);
    setSelectedIds(new Set());
  }, [selectedIds, updateActiveSheet, pushToast]);

  const handleDeleteSelected = useCallback(() => {
    const count = selectedIds.size;
    setConfirmState({
      title: `حذف ${count} صف محدد؟`,
      description: 'سيتم حذف الصفوف المحددة من القائمة الحالية نهائيًا.',
      confirmLabel: 'حذف المحدد',
      onConfirm: () => {
        updateActiveSheet((s) => ({
          ...s,
          rows: s.rows.filter((r) => !selectedIds.has(r.id)),
          updatedAt: Date.now(),
        }));
        setSelectedIds(new Set());
        setConfirmState(null);
        pushToast('info', `تم حذف ${count} صف`);
      },
    });
  }, [selectedIds, updateActiveSheet, pushToast]);

  // Excel Export & Import
  const handleExportExcel = useCallback(async () => {
    if (activeSheet.rows.length === 0) {
      pushToast('error', 'أضف صورة أو صفًا واحدًا على الأقل قبل التصدير');
      return;
    }
    setIsExporting(true);
    try {
      await exportSheetToExcel(activeSheet);
      pushToast('success', 'تم تصدير ملف Excel بالصور والمعادلات بنجاح');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير الملف';
      pushToast('error', msg);
    } finally {
      setIsExporting(false);
    }
  }, [activeSheet, pushToast]);

  const handleExcelImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const result = await importExcelFile(file, activeSheet.columns);
      if (result.rows.length === 0) {
        pushToast('error', 'لم يتم العثور على بيانات قابلة للاستيراد في الملف');
        return;
      }
      updateActiveSheet((s) => ({
        ...s,
        title: s.rows.length === 0 && result.title ? result.title : s.title,
        columns: s.rows.length === 0 ? result.columns : s.columns,
        rows: [...s.rows, ...result.rows],
        updatedAt: Date.now(),
      }));
      pushToast('success', `تم استيراد ${result.rows.length} بند من ملف Excel`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر قراءة ملف الإكسل';
      pushToast('error', msg);
    }
  };

  // JSON Backup & Restore
  const handleExportBackup = useCallback(() => {
    const payload = JSON.stringify(workspace, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    saveAs(
      new Blob([payload], { type: 'application/json;charset=utf-8' }),
      `XL_Packing_Backup_${dateStr}.json`
    );
    pushToast('success', 'تم تنزيل النسخة الاحتياطية (.json)');
  }, [workspace, pushToast]);

  const handleRestoreBackupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as WorkspaceState;
      if (!parsed || !Array.isArray(parsed.sheets) || parsed.sheets.length === 0) {
        throw new Error('صيغة ملف النسخة الاحتياطية غير صالحة');
      }
      setWorkspace(parsed);
      setSelectedIds(new Set());
      pushToast('success', `تمت استعادة ${parsed.sheets.length} قائمة بنجاح`);
    } catch {
      pushToast('error', 'ملف النسخة الاحتياطية غير صالح أو تالف');
    }
  };

  // Workspace Drag-and-Drop image upload
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFiles(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFiles(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await ingestImageFiles(files);
    }
  };

  const previewRow = useMemo(
    () => activeSheet.rows.find((r) => r.id === previewRowId) || null,
    [activeSheet.rows, previewRowId]
  );

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090E1A] text-slate-900 dark:text-slate-100"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <TopBar
        onOpenSidebar={() => setSidebarOpenMobile(true)}
        onOpenColumns={() => setColsModalOpen(true)}
        onOpenExcelSettings={() => setExcelModalOpen(true)}
        onTriggerImportExcel={() => excelImportInputRef.current?.click()}
        onPrint={() => window.print()}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
        rowCount={activeSheet.rows.length}
      />

      <div className="flex-1 flex min-w-0">
        <Sidebar
          sheets={workspace.sheets}
          activeSheetId={activeSheet.id}
          theme={workspace.theme}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
          onSelectSheet={handleSelectSheet}
          onCreateSheet={handleCreateSheet}
          onDuplicateSheet={handleDuplicateSheet}
          onDeleteSheet={handleDeleteSheet}
          onToggleTheme={() =>
            setWorkspace((prev) => ({
              ...prev,
              theme: prev.theme === 'dark' ? 'light' : 'dark',
            }))
          }
          onExportBackup={handleExportBackup}
          onTriggerRestoreBackup={() => backupRestoreInputRef.current?.click()}
          onOpenColumns={() => setColsModalOpen(true)}
          onOpenExcelSettings={() => setExcelModalOpen(true)}
          onTriggerImportExcel={() => excelImportInputRef.current?.click()}
          onPrint={() => window.print()}
        />

        <main className="flex-1 min-w-0 p-4 lg:p-6 max-w-[1360px] mx-auto w-full space-y-4">
          <WorkspaceToolbar
            sheet={activeSheet}
            totals={totals}
            viewMode={workspace.viewMode}
            searchQuery={searchQuery}
            imageFilter={imageFilter}
            selectedCount={selectedIds.size}
            savedLabel={savedLabel}
            onUpdateSheet={updateActiveSheet}
            onChangeViewMode={(mode) =>
              setWorkspace((prev) => ({ ...prev, viewMode: mode }))
            }
            onSearchChange={setSearchQuery}
            onImageFilterChange={setImageFilter}
            onBatchUploadClick={() => batchInputRef.current?.click()}
            onAddRow={handleAddRow}
            onQuickSizeChange={handleQuickSizeChange}
            onClearAllRows={handleClearAllRows}
            onOpenBulkEdit={() => setBulkModalOpen(true)}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onClearSelection={() => setSelectedIds(new Set())}
          />

          {workspace.viewMode === 'table' ? (
            <DataTableView
              sheet={activeSheet}
              filteredRows={filteredRows}
              selectedIds={selectedIds}
              isFiltered={isFiltered}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onUpdateCell={handleUpdateCell}
              onReplaceImage={handleTriggerReplaceImage}
              onPreviewImage={(id) => setPreviewRowId(id)}
              onRotateImage={handleRotateImage}
              onMoveRow={handleMoveRow}
              onDuplicateRow={handleDuplicateRow}
              onDeleteRow={handleDeleteRow}
              onBatchUploadClick={() => batchInputRef.current?.click()}
              onAddRow={handleAddRow}
              onResetFilters={() => {
                setSearchQuery('');
                setImageFilter('all');
              }}
            />
          ) : (
            <CardGridView
              sheet={activeSheet}
              filteredRows={filteredRows}
              selectedIds={selectedIds}
              isFiltered={isFiltered}
              onToggleSelect={handleToggleSelect}
              onUpdateCell={handleUpdateCell}
              onReplaceImage={handleTriggerReplaceImage}
              onPreviewImage={(id) => setPreviewRowId(id)}
              onRotateImage={handleRotateImage}
              onMoveRow={handleMoveRow}
              onDuplicateRow={handleDuplicateRow}
              onDeleteRow={handleDeleteRow}
              onBatchUploadClick={() => batchInputRef.current?.click()}
              onAddRow={handleAddRow}
              onResetFilters={() => {
                setSearchQuery('');
                setImageFilter('all');
              }}
            />
          )}

          <PrintCatalogView sheet={activeSheet} totals={totals} />
        </main>
      </div>

      {/* Drag & Drop Full-Viewport Overlay */}
      {isDraggingFiles && (
        <div className="no-print fixed inset-0 z-50 bg-blue-950/80 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="rounded-2xl border-2 border-dashed border-blue-400 bg-[#0D1424]/95 px-10 py-8 text-center shadow-2xl">
            <ImagePlus className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <div className="text-lg font-extrabold text-white">
              أفلت الصور هنا لإضافتها فورًا إلى القائمة
            </div>
            <p className="mt-1 text-xs text-slate-300">
              سيتم ضغط الصور تلقائيًا وتسمية كل بند باسم ملف الصورة
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <ColumnsModal
        isOpen={colsModalOpen}
        columns={activeSheet.columns}
        onChangeColumns={(cols) =>
          updateActiveSheet((s) => ({ ...s, columns: cols, updatedAt: Date.now() }))
        }
        onClose={() => setColsModalOpen(false)}
      />

      <ExcelSettingsModal
        isOpen={excelModalOpen}
        cfg={activeSheet.cfg}
        onChangeCfg={(cfg) =>
          updateActiveSheet((s) => ({ ...s, cfg, updatedAt: Date.now() }))
        }
        onClose={() => setExcelModalOpen(false)}
      />

      <BulkEditModal
        isOpen={bulkModalOpen}
        selectedCount={selectedIds.size}
        columns={activeSheet.columns}
        onApply={handleBulkEditApply}
        onClose={() => setBulkModalOpen(false)}
      />

      <ImageLightboxModal
        row={previewRow}
        onClose={() => setPreviewRowId(null)}
        onRotate={handleRotateImage}
        onReplace={handleTriggerReplaceImage}
        onRemoveImage={handleRemoveImage}
      />

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        confirmLabel={confirmState?.confirmLabel}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <OfflineIndicator />

      {/* Hidden File Inputs */}
      <input
        ref={batchInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleBatchInputChange}
      />
      <input
        ref={singleImgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSingleImageChange}
      />
      <input
        ref={excelImportInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleExcelImportChange}
      />
      <input
        ref={backupRestoreInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleRestoreBackupChange}
      />
    </div>
  );
}
