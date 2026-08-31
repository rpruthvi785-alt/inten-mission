'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Info, Check, Calendar, Layers } from 'lucide-react';
import { MatchStatus, MatchConflict, MatchWarning, DateFlowInfo } from '../types';

interface StatusBannerProps {
  status: MatchStatus;
  statusLabel?: string;
  reasons: string[];
  conflicts?: MatchConflict[];
  warnings?: MatchWarning[];
  dateFlow?: DateFlowInfo;
  poNumber: string;
}

const CONFLICT_DETAILS: Record<string, { title: string; desc: string; resolution: string }> = {
  invoice_date_after_po_date: {
    title: 'Invoice Date After PO Date',
    desc: 'Invoice date is dated after the Purchase Order creation date.',
    resolution: 'Verify document dates with vendor. Request corrected invoice if billing date was entered in error.',
  },
  invoice_qty_exceeds_grn_qty: {
    title: 'Invoice Quantity Exceeds GRN Received',
    desc: 'Billed invoice quantity is greater than physical goods received in GRN.',
    resolution: 'Verify if remaining goods are in transit. If not received, request a credit note or invoice amendment from vendor.',
  },
  invoice_qty_exceeds_po_qty: {
    title: 'Invoice Quantity Exceeds PO Ordered',
    desc: 'Billed invoice quantity exceeds the approved Purchase Order quantity tolerance.',
    resolution: 'Request an approved PO amendment or return/reject excess billed units.',
  },
  grn_qty_exceeds_po_qty: {
    title: 'GRN Received Quantity Exceeds PO Ordered',
    desc: 'Warehouse recorded received quantity greater than authorized in the Purchase Order tolerance.',
    resolution: 'Initiate goods return process for over-delivered items or obtain an approved PO revision.',
  },
  mrp_mismatch: {
    title: 'MRP Discrepancy (> 1% Variance)',
    desc: 'Document MRP differs from SKU Master authorized MRP by more than 1%.',
    resolution: 'Check physical packaging batch MRP. Update SKU Master if legitimate manufacturer price revision occurred.',
  },
  price_mismatch: {
    title: 'Price Mismatch Outside Tolerance',
    desc: 'Invoice unit price differs from SKU Master agreed rate beyond price tolerance (5%).',
    resolution: 'Verify contract terms and request a revised invoice matching agreed rate.',
  },
  duplicate_po: {
    title: 'Duplicate Purchase Order Detected',
    desc: 'Multiple Purchase Orders found with the same PO number in database.',
    resolution: 'Remove duplicate record or assign unique PO revision number.',
  },
  duplicate_document: {
    title: 'Duplicate GRN or Invoice Document',
    desc: 'Duplicate document number found for this Purchase Order.',
    resolution: 'Verify whether this is a duplicate submission and avoid double-processing.',
  },
  item_missing_in_po: {
    title: 'Item Missing in Purchase Order',
    desc: 'GRN or Invoice contains line items that were never ordered in the original PO.',
    resolution: 'Issue a PO amendment to authorize additional items or reject unlisted items.',
  },
  unmapped_master_sku: {
    title: 'Unmapped Master SKU Catalog Item',
    desc: 'One or more items could not be resolved against the SKU Master catalog.',
    resolution: 'Map item code to SKU Master catalog using the "+ Map" action.',
  },
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  statusLabel,
  reasons = [],
  conflicts = [],
  warnings = [],
  dateFlow,
  poNumber,
}) => {
  const hasHardConflicts = conflicts && conflicts.length > 0;
  const hasWarnings = warnings && warnings.length > 0;

  // 1. MATCHED (Zero Conflicts, Zero Warnings)
  if (status === 'matched' && !hasWarnings) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs flex items-start gap-3 sm:gap-3.5">
        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-emerald-950 text-sm sm:text-base">Three-Way Match Successful</span>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
              MATCHED
            </span>
          </div>
          <p className="text-emerald-800 text-xs mt-1 leading-relaxed">
            Purchase Order #{poNumber}, linked GRN(s), and Invoice(s) quantities and rates fully reconcile with zero mismatches. Approved for payment processing.
          </p>
          {dateFlow && dateFlow.isValidChronological && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-[11px] font-medium px-2.5 py-1 rounded-lg flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                <strong>Timeline:</strong> PO Date ({dateFlow.poDate}) → Invoice Date ({dateFlow.invoiceDate}) (+{dateFlow.differenceDays} days) — <em>✓ Valid chronological flow</em>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. MATCHED WITH WARNINGS (Within Tolerance, Zero Hard Conflicts)
  if ((status === 'partially_matched' || status === 'matched') && !hasHardConflicts) {
    return (
      <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs">
        <div className="flex items-start gap-3 sm:gap-3.5">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-emerald-950 text-sm sm:text-base">Three-Way Match Successful (Within Tolerance)</span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                {statusLabel || 'MATCHED WITH WARNINGS'}
              </span>
            </div>
            <p className="text-emerald-800 text-xs mt-1">
              Purchase Order #{poNumber}, Delivery GRN, and Invoice reconcile within authorized tolerances. Approved for payment.
            </p>

            {/* Date Chronology Badge */}
            {dateFlow && dateFlow.isValidChronological && (
              <div className="mt-3 flex items-center gap-2 bg-white border border-emerald-200 text-emerald-900 text-xs px-3 py-1.5 rounded-lg shadow-2xs w-fit">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>Chronological Flow:</strong> PO Issued ({dateFlow.poDate}) → Invoiced ({dateFlow.invoiceDate}) (+{dateFlow.differenceDays} days) — <span className="font-semibold text-emerald-700">✓ Valid chronological flow</span>
                </span>
              </div>
            )}

            {/* Accepted Tolerance Cards */}
            {hasWarnings && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {warnings.map((w, idx) => (
                  <div key={`${w.code}-${idx}`} className="bg-white border border-emerald-200 rounded-lg p-3.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                        <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        <span>Quantity Variance: {w.skuName || w.sku}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                        ✓ Within tolerance (+{w.tolerance})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded text-center font-mono my-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-sans">PO Qty:</span>
                        <strong className="text-slate-900">{w.poQty}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-sans">GRN Recv:</span>
                        <strong className="text-emerald-700">{w.grnQty}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-sans">Invoiced:</span>
                        <strong className="text-blue-700">{w.invoiceQty}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Variance: <strong className="text-emerald-700">+{w.variance} units</strong></span>
                      <span>Allowed Tolerance: <strong className="text-slate-800">+{w.tolerance} units</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. HARD MISMATCH (Blocking Violations)
  if (status === 'mismatch' || hasHardConflicts) {
    const displayConflicts = conflicts.length > 0
      ? conflicts
      : reasons.map((r) => {
          const d = CONFLICT_DETAILS[r] || { title: r, desc: r, resolution: 'Review document' };
          return { code: r, title: d.title, description: d.desc, resolution: d.resolution, details: null };
        });

    return (
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs">
        <div className="flex items-start gap-3 sm:gap-3.5">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-rose-950 text-sm sm:text-base">Three-Way Match Conflict (Hard Mismatch)</span>
              <span className="bg-rose-200 text-rose-900 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                HARD MISMATCH
              </span>
            </div>
            <p className="text-rose-800 text-xs mt-1">
              Hard validation errors exceed configured tolerances. Review each conflict and recommended resolution below.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayConflicts.map((c, idx) => (
                <div key={`${c.code}-${idx}`} className="bg-white border border-rose-200 rounded-lg p-3.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950 mb-1">
                    <span className="text-rose-600 font-mono text-sm">✕</span>
                    <span>{c.title}</span>
                  </div>
                  <p className="text-rose-800 mb-2 leading-relaxed">{c.description}</p>
                  <div className="bg-rose-50/70 border border-rose-100 p-2 rounded text-slate-700">
                    <span className="font-bold text-rose-900 block mb-0.5">Recommended Resolution:</span>
                    <span>{c.resolution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. INSUFFICIENT DOCUMENTS
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-xs flex items-start gap-3 sm:gap-3.5">
      <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-blue-950 text-sm sm:text-base">Awaiting Complete Document Set</span>
          <span className="bg-blue-200 text-blue-900 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
            INSUFFICIENT DOCUMENTS
          </span>
        </div>
        <p className="text-blue-800 text-xs mt-1 leading-relaxed">
          Full Three-Way Matching requires Purchase Order (PO), Goods Receipt Note (GRN / Delivery), and Invoice (Fulfillment) documents. Upload missing documents to complete automated reconciliation.
        </p>
      </div>
    </div>
  );
};
