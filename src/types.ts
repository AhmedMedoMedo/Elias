export type ColumnType = 'text' | 'number' | 'total' | 'ctn' | 'pcs_ctn' | 'cbm';

export interface ColumnDef {
  id: string;
  label: string;
  type: ColumnType;
  width: number;
}

export interface ProductRow {
  id: string;
  img: string | null;
  w: number;
  h: number;
  vals: Record<string, string | number>;
}

export type ImageFitMode = 'contain' | 'stretch';

export interface ExcelConfig {
  imgW: number;
  imgH: number;
  rowH: number;
  colW: number;
  fit: ImageFitMode;
  color: string;
  rtlSheet: boolean;
  useFormulas: boolean;
  zebraStripes: boolean;
  includeTotalsRow: boolean;
  includeMetaRow: boolean;
}

export type CurrencyCode = 'EGP' | 'USD' | 'RMB' | 'SAR' | 'AED' | '';

export interface SheetMetadata {
  supplier: string;
  shipmentNo: string;
  date: string;
  notes: string;
}

export interface ExchangeConfig {
  enabled: boolean;
  targetCurrency: Exclude<CurrencyCode, ''>;
  rate: number;
}

export interface SheetDoc {
  id: string;
  title: string;
  currency: CurrencyCode;
  exchange: ExchangeConfig;
  meta: SheetMetadata;
  cfg: ExcelConfig;
  columns: ColumnDef[];
  rows: ProductRow[];
  updatedAt: number;
}

export interface WorkspaceState {
  version: number;
  activeSheetId: string;
  theme: 'dark' | 'light';
  viewMode: 'table' | 'cards';
  sheets: SheetDoc[];
}

export interface SheetTotals {
  count: number;
  withImages: number;
  totalQty: number;
  totalCartons: number;
  hasCartons: boolean;
  totalCbm: number;
  hasCbm: boolean;
  totalMoney: number;
  convertedMoney: number | null;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ColumnTemplate {
  id: string;
  name: string;
  description: string;
  columns: ColumnDef[];
}
