import type { ColumnDef, ColumnTemplate, ExcelConfig, SheetDoc, WorkspaceState } from '../types';

export const DEFAULT_EXCEL_CFG: ExcelConfig = {
  imgW: 130,
  imgH: 115,
  rowH: 105,
  colW: 24,
  fit: 'contain',
  color: '1F4E78',
  rtlSheet: true,
  useFormulas: true,
  zebraStripes: true,
  includeTotalsRow: true,
  includeMetaRow: true,
};

export const HEADER_COLORS: { value: string; label: string; hex: string }[] = [
  { value: '1F4E78', label: 'أزرق صيني', hex: '#1F4E78' },
  { value: '065F46', label: 'أخضر داكن', hex: '#065F46' },
  { value: '1E293B', label: 'رمادي صخري', hex: '#1E293B' },
  { value: '7C2D12', label: 'عنابي تجاري', hex: '#7C2D12' },
  { value: '0F172A', label: 'أسود احترافي', hex: '#0F172A' },
];

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'basic',
    name: 'استيراد أساسي',
    description: 'الكود، الوصف، الكمية، السعر، الإجمالي',
    columns: [
      { id: 'code', label: 'الكود', type: 'text', width: 16 },
      { id: 'desc', label: 'الوصف', type: 'text', width: 34 },
      { id: 'qty', label: 'الكمية', type: 'number', width: 12 },
      { id: 'price', label: 'السعر', type: 'number', width: 14 },
      { id: 'total', label: 'الإجمالي', type: 'total', width: 16 },
    ],
  },
  {
    id: 'china_packing',
    name: 'باكنج ليست صيني شامل',
    description: 'الكود، الوصف، الكراتين، القطع/كرتونة، الكمية، السعر، الإجمالي، CBM، ملاحظات',
    columns: [
      { id: 'code', label: 'الكود / Item', type: 'text', width: 15 },
      { id: 'desc', label: 'الوصف / المواصفات', type: 'text', width: 30 },
      { id: 'ctn', label: 'عدد الكراتين', type: 'ctn', width: 13 },
      { id: 'pcs_ctn', label: 'القطع/كرتونة', type: 'pcs_ctn', width: 13 },
      { id: 'qty', label: 'إجمالي الكمية', type: 'number', width: 14 },
      { id: 'price', label: 'سعر القطعة', type: 'number', width: 13 },
      { id: 'total', label: 'الإجمالي', type: 'total', width: 16 },
      { id: 'cbm', label: 'حجم الكرتونة CBM', type: 'cbm', width: 15 },
      { id: 'notes', label: 'ملاحظات', type: 'text', width: 22 },
    ],
  },
  {
    id: 'wholesale_catalog',
    name: 'كتالوج أسعار جملة',
    description: 'الكود، الصنف، المقاس/اللون، أقل كمية MOQ، السعر، ملاحظات',
    columns: [
      { id: 'code', label: 'الكود', type: 'text', width: 15 },
      { id: 'desc', label: 'اسم الصنف', type: 'text', width: 32 },
      { id: 'variant', label: 'المقاس / اللون', type: 'text', width: 18 },
      { id: 'qty', label: 'الكمية / MOQ', type: 'number', width: 14 },
      { id: 'price', label: 'سعر الجملة', type: 'number', width: 14 },
      { id: 'total', label: 'الإجمالي', type: 'total', width: 16 },
    ],
  },
];

export function cloneColumns(cols: ColumnDef[]): ColumnDef[] {
  return cols.map((c) => ({ ...c }));
}

export function createNewSheet(
  title = 'قائمة البضائع والصور',
  templateId: string = 'basic'
): SheetDoc {
  const tpl = COLUMN_TEMPLATES.find((t) => t.id === templateId) ?? COLUMN_TEMPLATES[0];
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: 'sheet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title,
    currency: 'RMB',
    exchange: {
      enabled: false,
      targetCurrency: 'EGP',
      rate: 6.9,
    },
    meta: {
      supplier: '',
      shipmentNo: '',
      date: today,
      notes: '',
    },
    cfg: { ...DEFAULT_EXCEL_CFG },
    columns: cloneColumns(tpl.columns),
    rows: [],
    updatedAt: Date.now(),
  };
}

export function createDefaultWorkspace(): WorkspaceState {
  const firstSheet = createNewSheet('قائمة البضائع والصور', 'basic');
  return {
    version: 2,
    activeSheetId: firstSheet.id,
    theme: 'dark',
    viewMode: typeof window !== 'undefined' && window.innerWidth < 900 ? 'cards' : 'table',
    sheets: [firstSheet],
  };
}

const DB_NAME = 'XL_Packing_Pro_DB';
const STORE_NAME = 'workspace';
const LEGACY_DB_NAME = 'XL_Packing_Simple_DB';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject(e);
  });
  return dbPromise;
}

async function tryReadLegacyState(): Promise<SheetDoc | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(LEGACY_DB_NAME, 1);
      req.onupgradeneeded = () => {
        // Did not exist before
      };
      req.onsuccess = (e) => {
        const legacyDb = (e.target as IDBOpenDBRequest).result;
        if (!legacyDb.objectStoreNames.contains('data')) {
          legacyDb.close();
          resolve(null);
          return;
        }
        const tx = legacyDb.transaction('data', 'readonly');
        const getReq = tx.objectStore('data').get('state');
        getReq.onsuccess = () => {
          const old = getReq.result;
          legacyDb.close();
          if (old && Array.isArray(old.columns)) {
            const base = createNewSheet(old.title || 'قائمة البضائع والصور');
            base.currency = old.currency ?? 'EGP';
            base.cfg = { ...DEFAULT_EXCEL_CFG, ...(old.cfg || {}) };
            base.columns = old.columns;
            base.rows = Array.isArray(old.rows) ? old.rows : [];
            resolve(base);
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => {
          legacyDb.close();
          resolve(null);
        };
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadWorkspace(): Promise<WorkspaceState> {
  try {
    const db = await openDB();
    const saved = await new Promise<Partial<WorkspaceState> | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('state');
      req.onsuccess = () => resolve(req.result as Partial<WorkspaceState> | undefined);
      req.onerror = () => reject(req.error);
    });

    if (saved && Array.isArray(saved.sheets) && saved.sheets.length > 0) {
      const sheets: SheetDoc[] = saved.sheets.map((raw) => {
        const s = raw as Partial<SheetDoc>;
        const base = createNewSheet(s.title || 'قائمة البضائع والصور');
        return {
          ...base,
          ...s,
          cfg: { ...DEFAULT_EXCEL_CFG, ...(s.cfg ?? {}) },
          meta: { ...base.meta, ...(s.meta ?? {}) },
          exchange: { ...base.exchange, ...(s.exchange ?? {}) },
          columns: Array.isArray(s.columns) && s.columns.length > 0 ? s.columns : base.columns,
          rows: Array.isArray(s.rows) ? s.rows : [],
        };
      });
      const activeExists = sheets.some((s) => s.id === saved.activeSheetId);
      return {
        version: 2,
        activeSheetId: activeExists && saved.activeSheetId ? saved.activeSheetId : sheets[0].id,
        theme: saved.theme === 'light' ? 'light' : 'dark',
        viewMode: saved.viewMode === 'cards' ? 'cards' : 'table',
        sheets,
      };
    }

    // Attempt seamless migration from legacy single-sheet DB
    const migrated = await tryReadLegacyState();
    if (migrated) {
      const ws = createDefaultWorkspace();
      ws.sheets = [migrated];
      ws.activeSheetId = migrated.id;
      await saveWorkspace(ws);
      return ws;
    }
  } catch {
    // Fallback to default workspace
  }

  return createDefaultWorkspace();
}

export async function saveWorkspace(state: WorkspaceState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, 'state');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
