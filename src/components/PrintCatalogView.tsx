import React from 'react';
import type { SheetDoc, SheetTotals } from '../types';
import { computeRowTotal, formatMoney, formatNum } from '../utils/calculations';

interface PrintCatalogViewProps {
  sheet: SheetDoc;
  totals: SheetTotals;
}

export const PrintCatalogView: React.FC<PrintCatalogViewProps> = ({ sheet, totals }) => {
  return (
    <div className="hidden print-only text-slate-900 bg-white">
      <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-extrabold">{sheet.title || 'قائمة البضائع والصور'}</h1>
          <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-3">
            {sheet.meta.supplier && <span>المورد: {sheet.meta.supplier}</span>}
            {sheet.meta.shipmentNo && <span>رقم الشحنة: {sheet.meta.shipmentNo}</span>}
            {sheet.meta.date && <span>التاريخ: {sheet.meta.date}</span>}
            {sheet.currency && <span>العملة: {sheet.currency}</span>}
          </div>
        </div>
        <div className="text-left text-xs font-mono tabular-nums">
          <div className="font-bold">البنود: {totals.count} · الكمية: {formatNum(totals.totalQty, 0)}</div>
          <div className="text-sm font-extrabold">
            الإجمالي: {formatMoney(totals.totalMoney, sheet.currency)}
          </div>
          {totals.convertedMoney !== null && (
            <div>
              المعادل: {formatMoney(totals.convertedMoney, sheet.exchange.targetCurrency)}
            </div>
          )}
        </div>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="border border-slate-300 px-2 py-2 text-center w-8">م</th>
            <th className="border border-slate-300 px-2 py-2 text-center w-24">الصورة</th>
            {sheet.columns.map((c) => (
              <th key={c.id} className="border border-slate-300 px-2 py-2 text-center">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((r, idx) => (
            <tr key={r.id} className="break-inside-avoid">
              <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                {idx + 1}
              </td>
              <td className="border border-slate-300 p-1 text-center">
                {r.img ? (
                  <img
                    src={r.img}
                    alt=""
                    className="mx-auto max-h-20 max-w-20 object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">—</span>
                )}
              </td>
              {sheet.columns.map((c) => (
                <td
                  key={c.id}
                  className={`border border-slate-300 px-2 py-1.5 text-center ${
                    c.type !== 'text' ? 'font-mono tabular-nums' : ''
                  } ${c.type === 'total' ? 'font-bold' : ''}`}
                >
                  {c.type === 'total'
                    ? formatNum(computeRowTotal(r, sheet.columns), 2)
                    : r.vals[c.id] !== undefined
                      ? String(r.vals[c.id])
                      : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
