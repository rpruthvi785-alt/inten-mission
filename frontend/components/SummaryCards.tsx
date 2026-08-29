'use client';

import React from 'react';
import { PoSummary } from '../types';
import { IndianRupee, Receipt, Truck, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SummaryCardsProps {
  summary: PoSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const {
    poAmount = 0,
    totalInvoiced = 0,
    totalReceived = 0,
    cumulativePoQty = 0,
    cumulativeReceivedQty = 0,
    cumulativeInvoicedQty = 0,
    pendingDelivery = 0,
    currentStatus = 'insufficient_documents',
    linkedDocuments = { poCount: 0, grnCount: 0, invoiceCount: 0, pos: [], grns: [], invoices: [] },
  } = summary;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> MATCHED
          </span>
        );
      case 'partially_matched':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" /> PARTIALLY MATCHED
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> MISMATCH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" /> INSUFFICIENT DOCUMENTS
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PO Amount Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Amount</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{poAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Ordered Qty: <strong className="text-slate-800">{cumulativePoQty}</strong> units</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Invoiced Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Billed Qty: <strong className="text-slate-800">{cumulativeInvoicedQty}</strong> units</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Total Received Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Received</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Received Qty: <strong className="text-slate-800">{cumulativeReceivedQty}</strong> units</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Associated Invoice & GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Associated Invoices & Goods Receipt Notes (GRNs)
          </h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            PO #{summary.poNumber}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Document Type</th>
                <th className="py-3 px-4 text-left">Document Number</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-right">Items Count</th>
                <th className="py-3 px-4 text-left">Vendor / Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Linked POs */}
              {(linkedDocuments.pos || []).map((po, i) => (
                <tr key={`po-${i}`} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-indigo-700">Purchase Order</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{po.poNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{po.date ? new Date(po.date).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{cumulativePoQty}</td>
                  <td className="py-3 px-4 text-slate-600">{po.vendor || 'Supplier'}</td>
                </tr>
              ))}

              {/* Linked GRNs */}
              {(linkedDocuments.grns || []).map((grn, i) => (
                <tr key={`grn-${i}`} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-emerald-700">Delivery GRN</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{grn.grnNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{grn.date ? new Date(grn.date).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{grn.itemCount}</td>
                  <td className="py-3 px-4 text-slate-600">Goods Receipt</td>
                </tr>
              ))}

              {/* Linked Invoices */}
              {(linkedDocuments.invoices || []).map((inv, i) => (
                <tr key={`inv-${i}`} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-blue-700">Fulfillment Invoice</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{inv.itemCount}</td>
                  <td className="py-3 px-4 text-slate-600">Tax Invoice</td>
                </tr>
              ))}

              {/* Final Row: Current Status & Cumulative Metrics */}
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-4 px-4 text-sm" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <span>Reconciliation Status:</span>
                    {renderStatusBadge(currentStatus)}
                  </div>
                </td>
                <td className="py-4 px-4 text-right" colSpan={3}>
                  <div className="flex items-center justify-end gap-6 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-sans">Cumulative Received:</span>
                      <span className="text-emerald-700 text-sm font-bold">{cumulativeReceivedQty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-sans">Cumulative Invoiced:</span>
                      <span className="text-blue-700 text-sm font-bold">{cumulativeInvoicedQty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-sans">Pending Delivery:</span>
                      <span className={`text-sm font-bold ${pendingDelivery > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                        {pendingDelivery} units
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
