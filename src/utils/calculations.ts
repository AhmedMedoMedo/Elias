import type { ColumnDef, CurrencyCode, ProductRow, SheetDoc, SheetTotals } from '../types';

export function toNum(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getQtyColumnId(columns: ColumnDef[]): string {
  const byId = columns.find((c) => c.id === 'qty');
  if (byId) return byId.id;
  const byLabel = columns.find((c) => /كمية|qty|quantity/i.test(c.label) && c.type === 'number');
  return byLabel ? byLabel.id : 'qty';
}

export function getPriceColumnId(columns: ColumnDef[]): string {
  const byId = columns.find((c) => c.id === 'price');
  if (byId) return byId.id;
  const byLabel = columns.find((c) => /سعر|price|cost|unit/i.test(c.label) && c.type === 'number');
  return byLabel ? byLabel.id : 'price';
}

export function computeRowQty(row: ProductRow, columns: ColumnDef[]): number {
  const qtyCol = getQtyColumnId(columns);
  const directQty = toNum(row.vals[qtyCol]);
  if (directQty > 0) return directQty;

  const ctnCol = columns.find((c) => c.type === 'ctn');
  const pcsCol = columns.find((c) => c.type === 'pcs_ctn');
  if (ctnCol && pcsCol) {
    const ctn = toNum(row.vals[ctnCol.id]);
    const pcs = toNum(row.vals[pcsCol.id]);
    if (ctn > 0 && pcs > 0) return ctn * pcs;
  }
  return directQty;
}

export function computeRowTotal(row: ProductRow, columns: ColumnDef[]): number {
  const qty = computeRowQty(row, columns);
  const priceCol = getPriceColumnId(columns);
  const price = toNum(row.vals[priceCol]);
  return qty * price;
}

export function computeRowCbm(row: ProductRow, columns: ColumnDef[]): number {
  const cbmCol = columns.find((c) => c.type === 'cbm');
  if (!cbmCol) return 0;
  const unitCbm = toNum(row.vals[cbmCol.id]);
  const ctnCol = columns.find((c) => c.type === 'ctn');
  if (ctnCol) {
    const ctn = toNum(row.vals[ctnCol.id]);
    return ctn > 0 ? unitCbm * ctn : unitCbm;
  }
  return unitCbm;
}

export function computeSheetTotals(sheet: SheetDoc): SheetTotals {
  const ctnCol = sheet.columns.find((c) => c.type === 'ctn');
  const cbmCol = sheet.columns.find((c) => c.type === 'cbm');

  let withImages = 0;
  let totalQty = 0;
  let totalCartons = 0;
  let totalCbm = 0;
  let totalMoney = 0;

  for (const row of sheet.rows) {
    if (row.img) withImages++;
    const qty = computeRowQty(row, sheet.columns);
    totalQty += qty;
    totalMoney += computeRowTotal(row, sheet.columns);
    if (ctnCol) {
      totalCartons += toNum(row.vals[ctnCol.id]);
    }
    if (cbmCol) {
      totalCbm += computeRowCbm(row, sheet.columns);
    }
  }

  const convertedMoney =
    sheet.exchange.enabled && sheet.exchange.rate > 0
      ? totalMoney * sheet.exchange.rate
      : null;

  return {
    count: sheet.rows.length,
    withImages,
    totalQty,
    totalCartons,
    hasCartons: Boolean(ctnCol),
    totalCbm,
    hasCbm: Boolean(cbmCol),
    totalMoney,
    convertedMoney,
  };
}

export function formatNum(value: number, maxDecimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  const formatted = formatNum(value, 2);
  return currency ? `${formatted} ${currency}` : formatted;
}
