import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ColumnDef, ProductRow, SheetDoc } from '../types';
import {
  computeRowQty,
  computeRowTotal,
  computeSheetTotals,
  getPriceColumnId,
  getQtyColumnId,
  toNum,
} from './calculations';

function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let n = colIndex;
  while (n > 0) {
    const mod = (n - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    n = Math.floor((n - mod) / 26);
  }
  return letter;
}

function darkenHex(hex: string, factor = 0.82): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '2F5597';
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function exportSheetToExcel(sheet: SheetDoc): Promise<void> {
  if (!sheet.rows.length) {
    throw new Error('أضف صورة أو صفًا واحدًا على الأقل قبل التصدير');
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام البضائع الصيني XL';
  wb.created = new Date();

  const ws = wb.addWorksheet('Packing List', {
    views: [{ rightToLeft: sheet.cfg.rtlSheet, state: 'frozen', ySplit: sheet.cfg.includeMetaRow ? 3 : 2 }],
  });

  const totalCols = 2 + sheet.columns.length;
  const colDefs = [
    { key: 'no', width: 7 },
    { key: 'photo', width: Math.max(12, sheet.cfg.colW) },
    ...sheet.columns.map((c) => ({ key: c.id, width: Math.max(10, c.width || 16) })),
  ];
  ws.columns = colDefs;

  const primaryColor = (sheet.cfg.color || '1F4E78').replace('#', '').toUpperCase();
  const subHeaderColor = darkenHex(primaryColor, 0.85);

  let currentRow = 1;

  // Row 1: Title Banner
  const titleRow = ws.getRow(currentRow);
  titleRow.getCell(1).value = sheet.title || 'قائمة البضائع والصور';
  ws.mergeCells(currentRow, 1, currentRow, totalCols);
  titleRow.height = 34;
  titleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + primaryColor },
  };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  // Optional Row 2: Supplier & Shipment Metadata
  if (sheet.cfg.includeMetaRow) {
    const parts: string[] = [];
    if (sheet.meta.supplier.trim()) parts.push(`المورد: ${sheet.meta.supplier.trim()}`);
    if (sheet.meta.shipmentNo.trim()) parts.push(`رقم الشحنة: ${sheet.meta.shipmentNo.trim()}`);
    if (sheet.meta.date.trim()) parts.push(`التاريخ: ${sheet.meta.date.trim()}`);
    if (sheet.currency) parts.push(`العملة: ${sheet.currency}`);
    if (sheet.exchange.enabled && sheet.exchange.rate > 0) {
      parts.push(`سعر الصرف: 1 ${sheet.currency || ''} = ${sheet.exchange.rate} ${sheet.exchange.targetCurrency}`);
    }
    if (sheet.meta.notes.trim()) parts.push(`ملاحظات: ${sheet.meta.notes.trim()}`);

    const metaRow = ws.getRow(currentRow);
    metaRow.getCell(1).value = parts.length > 0 ? parts.join('   |   ') : `عدد البنود: ${sheet.rows.length}`;
    ws.mergeCells(currentRow, 1, currentRow, totalCols);
    metaRow.height = 24;
    metaRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    metaRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    metaRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    currentRow++;
  }

  // Table Headers Row
  const headerRow = ws.getRow(currentRow);
  const headers = ['م', 'الصورة', ...sheet.columns.map((c) => c.label)];
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + subHeaderColor },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });
  headerRow.height = 28;
  currentRow++;

  const firstDataRow = currentRow;

  // Resolve formula column letters
  const qtyColId = getQtyColumnId(sheet.columns);
  const priceColId = getPriceColumnId(sheet.columns);
  const qtyColIdx = sheet.columns.findIndex((c) => c.id === qtyColId);
  const priceColIdx = sheet.columns.findIndex((c) => c.id === priceColId);
  const ctnColIdx = sheet.columns.findIndex((c) => c.type === 'ctn');
  const pcsColIdx = sheet.columns.findIndex((c) => c.type === 'pcs_ctn');

  const qtyLetter = qtyColIdx >= 0 ? colIndexToLetter(qtyColIdx + 3) : null;
  const priceLetter = priceColIdx >= 0 ? colIndexToLetter(priceColIdx + 3) : null;
  const ctnLetter = ctnColIdx >= 0 ? colIndexToLetter(ctnColIdx + 3) : null;
  const pcsLetter = pcsColIdx >= 0 ? colIndexToLetter(pcsColIdx + 3) : null;

  for (let i = 0; i < sheet.rows.length; i++) {
    const r = sheet.rows[i];
    const rowNum = currentRow;
    const xlRow = ws.getRow(rowNum);
    xlRow.height = sheet.cfg.rowH;

    xlRow.getCell(1).value = i + 1;
    xlRow.getCell(2).value = '';

    const computedQty = computeRowQty(r, sheet.columns);
    const computedTotal = computeRowTotal(r, sheet.columns);

    sheet.columns.forEach((col, cIdx) => {
      const cell = xlRow.getCell(cIdx + 3);

      if (col.type === 'total') {
        if (sheet.cfg.useFormulas && qtyLetter && priceLetter) {
          cell.value = {
            formula: `${qtyLetter}${rowNum}*${priceLetter}${rowNum}`,
            result: computedTotal,
          };
        } else {
          cell.value = computedTotal;
        }
        cell.numFmt = '#,##0.00';
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      } else if (
        col.id === qtyColId &&
        sheet.cfg.useFormulas &&
        ctnLetter &&
        pcsLetter &&
        toNum(r.vals[col.id]) === 0 &&
        computedQty > 0
      ) {
        cell.value = {
          formula: `${ctnLetter}${rowNum}*${pcsLetter}${rowNum}`,
          result: computedQty,
        };
        cell.numFmt = '#,##0';
      } else if (
        col.type === 'number' ||
        col.type === 'ctn' ||
        col.type === 'pcs_ctn' ||
        col.type === 'cbm'
      ) {
        const num = toNum(r.vals[col.id]);
        cell.value = num;
        cell.numFmt = col.type === 'cbm' ? '#,##0.000' : '#,##0.##';
      } else {
        cell.value = r.vals[col.id] !== undefined ? String(r.vals[col.id]) : '';
      }
    });

    const isZebra = sheet.cfg.zebraStripes && i % 2 === 1;
    for (let c = 1; c <= totalCols; c++) {
      const cell = xlRow.getCell(c);
      if (!cell.font) {
        cell.font = { name: 'Arial', size: 10.5, color: { argb: 'FF0F172A' } };
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (isZebra) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    }

    if (r.img) {
      let dw = sheet.cfg.imgW;
      let dh = sheet.cfg.imgH;
      if (sheet.cfg.fit === 'contain' && r.w > 0 && r.h > 0) {
        const ratio = Math.min(sheet.cfg.imgW / r.w, sheet.cfg.imgH / r.h);
        dw = Math.max(20, Math.round(r.w * ratio));
        dh = Math.max(20, Math.round(r.h * ratio));
      }
      const ext = r.img.startsWith('data:image/png') ? 'png' : 'jpeg';
      const imgId = wb.addImage({ base64: r.img, extension: ext });
      ws.addImage(imgId, {
        tl: { col: 1.08, row: rowNum - 1 + 0.08 },
        ext: { width: dw, height: dh },
        editAs: 'oneCell',
      });
    }

    currentRow++;
  }

  const lastDataRow = currentRow - 1;
  const totals = computeSheetTotals(sheet);

  // Summary Totals Row
  if (sheet.cfg.includeTotalsRow) {
    const sumRow = ws.getRow(currentRow);
    sumRow.height = 30;
    sumRow.getCell(1).value = 'الإجمالي';
    sumRow.getCell(2).value = `${totals.count} بند`;

    sheet.columns.forEach((col, cIdx) => {
      const colNumber = cIdx + 3;
      const letter = colIndexToLetter(colNumber);
      const cell = sumRow.getCell(colNumber);

      if (col.type === 'total') {
        cell.value = sheet.cfg.useFormulas
          ? { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, result: totals.totalMoney }
          : totals.totalMoney;
        cell.numFmt = sheet.currency ? `#,##0.00 "${sheet.currency}"` : '#,##0.00';
      } else if (col.id === qtyColId) {
        cell.value = sheet.cfg.useFormulas
          ? { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, result: totals.totalQty }
          : totals.totalQty;
        cell.numFmt = '#,##0';
      } else if (col.type === 'ctn') {
        cell.value = sheet.cfg.useFormulas
          ? { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, result: totals.totalCartons }
          : totals.totalCartons;
        cell.numFmt = '#,##0';
      } else if (col.type === 'cbm') {
        cell.value = sheet.cfg.useFormulas
          ? { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, result: totals.totalCbm }
          : totals.totalCbm;
        cell.numFmt = '#,##0.000';
      }
    });

    for (let c = 1; c <= totalCols; c++) {
      const cell = sumRow.getCell(c);
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + primaryColor },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    }
    currentRow++;

    // Optional Secondary Currency Equivalent Row
    if (sheet.exchange.enabled && totals.convertedMoney !== null) {
      const totalColIdx = sheet.columns.findIndex((c) => c.type === 'total');
      const convRow = ws.getRow(currentRow);
      convRow.height = 26;
      convRow.getCell(1).value = `المعادل بـ ${sheet.exchange.targetCurrency}`;
      ws.mergeCells(currentRow, 1, currentRow, Math.max(2, totalCols - 1));
      const targetCell = convRow.getCell(totalCols);
      if (sheet.cfg.useFormulas && totalColIdx >= 0) {
        const totalLetter = colIndexToLetter(totalColIdx + 3);
        targetCell.value = {
          formula: `${totalLetter}${currentRow - 1}*${sheet.exchange.rate}`,
          result: totals.convertedMoney,
        };
      } else {
        targetCell.value = totals.convertedMoney;
      }
      targetCell.numFmt = `#,##0.00 "${sheet.exchange.targetCurrency}"`;

      for (let c = 1; c <= totalCols; c++) {
        const cell = convRow.getCell(c);
        cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF065F46' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFECFDF5' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFA7F3D0' } },
          bottom: { style: 'medium', color: { argb: 'FF065F46' } },
          left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
          right: { style: 'thin', color: { argb: 'FFA7F3D0' } },
        };
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const safeName = (sheet.title || 'Packing_List').replace(/[\\/:*?"<>|]/g, '_').trim();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${safeName}.xlsx`);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function measureDataUrl(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 120, h: img.naturalHeight || 120 });
    img.onerror = () => resolve({ w: 120, h: 120 });
    img.src = dataUrl;
  });
}

export async function importExcelFile(
  file: File,
  existingColumns: ColumnDef[]
): Promise<{ rows: ProductRow[]; columns: ColumnDef[]; title?: string }> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error('الملف لا يحتوي على أوراق عمل');

  // Map row index -> embedded image dataUrl
  const rowImages = new Map<number, { url: string; w: number; h: number }>();
  const images = ws.getImages();
  for (const img of images) {
    try {
      const media = wb.getImage(Number(img.imageId));
      if (!media || !media.buffer) continue;
      const bytes = media.buffer instanceof Uint8Array ? media.buffer : new Uint8Array(media.buffer as ArrayBuffer);
      const ext = media.extension === 'png' ? 'png' : 'jpeg';
      const dataUrl = `data:image/${ext};base64,${uint8ToBase64(bytes)}`;
      const dims = await measureDataUrl(dataUrl);
      const tlRow = Math.round(img.range.tl.nativeRow) + 1;
      if (!rowImages.has(tlRow)) {
        rowImages.set(tlRow, { url: dataUrl, w: dims.w, h: dims.h });
      }
    } catch {
      // Ignore unreadable individual image
    }
  }

  // Locate header row (first row with >= 2 non-empty cells)
  let headerRowIdx = 1;
  let detectedTitle: string | undefined;
  for (let r = 1; r <= Math.min(6, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const nonEmpty: string[] = [];
    row.eachCell((cell) => {
      const txt = String(cell.text || '').trim();
      if (txt) nonEmpty.push(txt);
    });
    if (nonEmpty.length === 1 && r === 1) {
      detectedTitle = nonEmpty[0];
    } else if (nonEmpty.length >= 2) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = ws.getRow(headerRowIdx);
  const excelCols: { colNumber: number; label: string }[] = [];
  headerRow.eachCell((cell, colNumber) => {
    const label = String(cell.text || '').trim();
    if (!label) return;
    if (/^(no\.?|#|م|صورة|photo|image|الصورة)$/i.test(label)) return;
    excelCols.push({ colNumber, label });
  });

  // Match or build columns
  const finalCols: ColumnDef[] =
    excelCols.length > 0
      ? excelCols.map((ec, idx) => {
          const match = existingColumns.find(
            (c) => c.label.trim().toLowerCase() === ec.label.toLowerCase()
          );
          if (match) return { ...match };
          if (/إجمالي|الاجمالي|total|amount/i.test(ec.label)) {
            return { id: 'total', label: ec.label, type: 'total', width: 16 };
          }
          if (/كمية|qty|quantity/i.test(ec.label)) {
            return { id: 'qty', label: ec.label, type: 'number', width: 12 };
          }
          if (/سعر|price|cost/i.test(ec.label)) {
            return { id: 'price', label: ec.label, type: 'number', width: 14 };
          }
          if (/كرتون|كراتين|ctn|carton/i.test(ec.label)) {
            return { id: `ctn_${idx}`, label: ec.label, type: 'ctn', width: 13 };
          }
          if (/cbm|حجم/i.test(ec.label)) {
            return { id: `cbm_${idx}`, label: ec.label, type: 'cbm', width: 14 };
          }
          if (/كود|code|sku|item/i.test(ec.label)) {
            return { id: 'code', label: ec.label, type: 'text', width: 16 };
          }
          return {
            id: `imp_${idx}_${Date.now().toString(36)}`,
            label: ec.label,
            type: 'text',
            width: 20,
          };
        })
      : existingColumns;

  const importedRows: ProductRow[] = [];
  for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const firstCellText = String(row.getCell(1).text || '').trim();
    if (/^(الإجمالي|الاجمالي|total|المعادل)/i.test(firstCellText)) {
      continue;
    }

    const vals: Record<string, string | number> = {};
    let hasContent = false;

    excelCols.forEach((ec, idx) => {
      const targetCol = finalCols[idx];
      if (!targetCol || targetCol.type === 'total') return;
      const cell = row.getCell(ec.colNumber);
      const rawVal = cell.value;
      let val: string | number = '';
      if (rawVal !== null && rawVal !== undefined) {
        if (typeof rawVal === 'object' && 'result' in rawVal && rawVal.result !== undefined) {
          val = typeof rawVal.result === 'number' ? rawVal.result : String(rawVal.result);
        } else if (typeof rawVal === 'number') {
          val = rawVal;
        } else {
          val = String(cell.text || '').trim();
        }
      }
      if (val !== '') hasContent = true;
      vals[targetCol.id] =
        targetCol.type === 'number' ||
        targetCol.type === 'ctn' ||
        targetCol.type === 'pcs_ctn' ||
        targetCol.type === 'cbm'
          ? toNum(val)
          : String(val);
    });

    const img = rowImages.get(r) || null;
    if (!hasContent && !img) continue;

    importedRows.push({
      id: 'r_' + Date.now() + '_' + r + '_' + Math.random().toString(36).slice(2, 5),
      img: img ? img.url : null,
      w: img ? img.w : 0,
      h: img ? img.h : 0,
      vals,
    });
  }

  return {
    rows: importedRows,
    columns: finalCols,
    title: detectedTitle,
  };
}
