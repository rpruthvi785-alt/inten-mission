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
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> MATCHED
          </span>
        );
      case 'partially_matched':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" /> PARTIALLY MATCHED
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> MISMATCH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" /> INSUFFICIENT DOCUMENTS
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* PO Amount Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Amount</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{poAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Ordered Qty: <strong className="text-slate-800">{cumulativePoQty}</strong> units</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Invoiced Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Billed Qty: <strong className="text-slate-800">{cumulativeInvoicedQty}</strong> units</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Received Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Received</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Received Qty: <strong className="text-slate-800">{cumulativeReceivedQty}</strong> units</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Associated Invoice & GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Associated Invoices & Goods Receipt Notes (GRNs)
          </h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded w-fit">
            PO #{summary.poNumber}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="min-w-[640px] lg:min-w-full divide-y divide-slate-200 text-xs">
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
            </tbody>
          </table>
        </div>

        {/* Responsive Summary Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-slate-700 text-sm">Status:</span>
            {renderStatusBadge(currentStatus)}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full md:w-auto text-left md:text-right">
            <div className="bg-white md:bg-transparent p-2 md:p-0 rounded border md:border-0 border-slate-200">
              <span className="text-slate-500 block text-[10px] sm:text-[11px] font-sans">Received:</span>
              <span className="text-emerald-700 text-xs sm:text-sm font-bold">{cumulativeReceivedQty} units</span>
            </div>
            <div className="bg-white md:bg-transparent p-2 md:p-0 rounded border md:border-0 border-slate-200">
              <span className="text-slate-500 block text-[10px] sm:text-[11px] font-sans">Invoiced:</span>
              <span className="text-blue-700 text-xs sm:text-sm font-bold">{cumulativeInvoicedQty} units</span>
            </div>
            <div className="bg-white md:bg-transparent p-2 md:p-0 rounded border md:border-0 border-slate-200">
              <span className="text-slate-500 block text-[10px] sm:text-[11px] font-sans">Pending:</span>
              <span className={`text-xs sm:text-sm font-bold ${pendingDelivery > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {pendingDelivery} units
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

