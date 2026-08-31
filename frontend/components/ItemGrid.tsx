'use client';

import React from 'react';
import { MatchItem } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ItemGridProps {
  items: MatchItem[];
  onOpenSkuMasterModal?: (code: string) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onOpenSkuMasterModal,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
        No line items available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-6">
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Line Item Reconciliation ({items.length} SKUs)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Reconciled across Purchase Order, Delivery & Fulfillment
          </p>
        </div>
        <span className="text-[10px] sm:text-xs font-medium text-indigo-600 sm:text-slate-500 bg-indigo-50 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded w-fit">
          Swipe horizontally to view all metrics →
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[860px] lg:min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">SKU Name</th>
              <th className="py-3 px-3">SKU ID / Code</th>
              <th className="py-3 px-3">Mapped SKU Name</th>
              <th className="py-3 px-3">ERP Code</th>
              <th className="py-3 px-3">EAN</th>
              <th className="py-3 px-3">HSN</th>
              <th className="py-3 px-3 text-center">UOM</th>
              <th className="py-3 px-3 text-right">PO Qty</th>
              <th className="py-3 px-3 text-right">GRN Qty</th>
              <th className="py-3 px-3 text-right">Invoice Qty</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-right">Unit MRP</th>
              <th className="py-3 px-3 text-right">Gross Amount</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, idx) => {
              const isUnmapped = item.reasons?.includes('unmapped_master_sku');
              const hasQtyMismatch = item.reasons?.some(r => r.includes('qty'));
              const hasPriceMismatch = item.reasons?.includes('price_mismatch');
              const hasMrpMismatch = item.reasons?.includes('mrp_mismatch');
              const rate = item.invoiceRate || item.agreedRate || 0;
              const gross = (item.invoiceQty || item.poQty) * rate;

              return (
                <tr
                  key={`${item.sku}-${idx}`}
                  className={`hover:bg-slate-50 transition-colors ${
                    isUnmapped
                      ? 'bg-amber-50/40'
                      : hasQtyMismatch
                      ? 'bg-rose-50/30'
                      : ''
                  }`}
                >
                  {/* SKU Name */}
                  <td className="py-3 px-3 font-medium text-slate-900 max-w-[180px] truncate" title={item.skuName || item.sku}>
                    {item.skuName || <span className="italic text-slate-400">Unresolved</span>}
                  </td>

                  {/* SKU ID */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.sku}
                  </td>

                  {/* Mapped SKU Name */}
                  <td className="py-3 px-3">
                    {isUnmapped ? (
                      <div className="flex items-center gap-1 text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="font-semibold text-xs">Unmapped</span>
                        {onOpenSkuMasterModal && (
                          <button
                            onClick={() => onOpenSkuMasterModal(item.sku)}
                            className="ml-1 text-[11px] text-indigo-600 hover:underline"
                          >
                            + Map
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-medium">{item.skuName}</span>
                    )}
                  </td>

                  {/* ERP Code */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.erpCode || '-'}
                  </td>

                  {/* EAN */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.eanCode || '-'}
                  </td>

                  {/* HSN */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.hsnCode || '-'}
                  </td>

                  {/* UOM */}
                  <td className="py-3 px-3 text-center text-slate-600">
                    {item.uom || 'NOS'}
                  </td>

                  {/* PO Qty */}
                  <td className={`py-3 px-3 text-right font-medium ${
                    hasQtyMismatch ? 'text-rose-700 font-bold bg-rose-50' : 'text-slate-800'
                  }`}>
                    {item.poQty}
                  </td>

                  {/* GRN Qty */}
                  <td className={`py-3 px-3 text-right font-medium ${
                    item.reasons.includes('grn_qty_exceeds_po_qty')
                      ? 'text-rose-700 font-bold bg-rose-100'
                      : 'text-slate-800'
                  }`}>
                    {item.grnQty}
                  </td>

                  {/* Invoice Qty */}
                  <td className={`py-3 px-3 text-right font-medium ${
                    item.reasons.includes('invoice_qty_exceeds_grn_qty') || item.reasons.includes('invoice_qty_exceeds_po_qty')
                      ? 'text-rose-700 font-bold bg-rose-100'
                      : 'text-slate-800'
                  }`}>
                    {item.invoiceQty}
                  </td>

                  {/* Unit Price */}
                  <td className={`py-3 px-3 text-right ${
                    hasPriceMismatch ? 'text-amber-700 font-bold bg-amber-100' : 'text-slate-700'
                  }`}>
                    {item.invoiceRate !== null ? `₹${item.invoiceRate.toFixed(2)}` : item.agreedRate !== null ? `₹${item.agreedRate.toFixed(2)} (agreed)` : '-'}
                  </td>

                  {/* Unit MRP */}
                  <td className={`py-3 px-3 text-right ${
                    hasMrpMismatch ? 'text-amber-700 font-bold bg-amber-100' : 'text-slate-700'
                  }`}>
                    {item.mrp !== null ? `₹${item.mrp.toFixed(2)}` : '-'}
                  </td>

                  {/* Gross Amount */}
                  <td className="py-3 px-3 text-right font-semibold text-slate-900">
                    {gross > 0 ? `₹${gross.toFixed(2)}` : '-'}
                  </td>

                  {/* Status / Reasons */}
                  <td className="py-3 px-3 text-center">
                    {item.reasons.length === 0 ? (
                      item.warnings && item.warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                          ✓ +{item.warnings[0].variance} within tolerance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          <CheckCircle className="w-3 h-3" /> OK
                        </span>
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        {item.reasons.map((r) => (
                          <span
                            key={r}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              r.includes('qty') || r.includes('missing')
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
