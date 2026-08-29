'use client';

import React from 'react';
import { FileText, Calendar, Building, Hash, Layers, Receipt, Truck, DollarSign, Package } from 'lucide-react';
import { PurchaseOrderDoc, GrnDoc, InvoiceDoc } from '../types';

interface DocumentDetailsProps {
  type: 'po' | 'fulfillment' | 'delivery';
  doc?: PurchaseOrderDoc | GrnDoc | InvoiceDoc | null;
  docsList?: Array<any>;
  selectedIndex?: number;
  onSelectDoc?: (index: number) => void;
}

function fmt(v: number | null | undefined) {
  if (v == null) return '-';
  return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function fmtDate(v?: string | null) {
  if (!v) return 'N/A';
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({
  type,
  doc,
  docsList = [],
  selectedIndex = 0,
  onSelectDoc,
}) => {
  if (!doc) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
          {type === 'po' ? 'Purchase Order Details' : type === 'fulfillment' ? 'Invoice Details' : 'GRN Details'}
        </h3>
        <p className="text-sm text-slate-500 italic">No document available for this section.</p>
      </div>
    );
  }

  const isPo      = type === 'po';
  const isInvoice = type === 'fulfillment';
  const isGrn     = type === 'delivery';

  const invDoc = doc as InvoiceDoc;
  const grnDoc = doc as GrnDoc;
  const poDoc  = doc as PurchaseOrderDoc;

  // Pull financial totals from rawParsed (stored at upload / seed time)
  const raw = (doc as any).rawParsed || {};

  // Invoice financials
  const taxableValue  = raw.taxableValue  ?? null;
  const cgst          = raw.cgst          ?? null;
  const sgst          = raw.sgst          ?? null;
  const totalAmount   = raw.totalAmount   ?? null;
  const buyerGstin    = raw.buyerGstin    ?? raw.gstin ?? null;
  const vendorGstin   = raw.vendorGstin   ?? null;

  // GRN specifics
  const inboundNumber   = raw.inboundNumber   ?? null;
  const invoiceRefInGrn = raw.invoiceNumber   ?? null;
  const expectedQty     = raw.expectedQty     ?? null;
  const receivedQty     = raw.receivedQty     ?? null;

  // PO specifics
  const paymentTerms  = raw.paymentTerms  ?? null;
  const poExpiry      = raw.poExpiryDate  ?? null;
  const deliveryDate  = raw.expectedDeliveryDate ?? null;

  // Compute item totals dynamically if not in rawParsed
  const items = doc.items || [];
  const computedTaxable = isInvoice
    ? items.reduce((s, i: any) => s + (Number(i.quantity || 0) * Number(i.unitRate || 0)), 0)
    : 0;
  const computedCgst = computedTaxable * 0.025;
  const computedSgst = computedTaxable * 0.025;
  const computedTotal = computedTaxable + computedCgst + computedSgst;

  const displayTaxable = taxableValue ?? (computedTaxable > 0 ? Number(computedTaxable.toFixed(2)) : null);
  const displayCgst    = cgst        ?? (computedCgst   > 0 ? Number(computedCgst.toFixed(2))   : null);
  const displaySgst    = sgst        ?? (computedSgst   > 0 ? Number(computedSgst.toFixed(2))   : null);
  const displayTotal   = totalAmount ?? (computedTotal  > 0 ? Number(computedTotal.toFixed(2))  : null);

  const grnExpected = expectedQty ?? items.reduce((s: number, i: any) => s + (Number(i.expectedQuantity || i.quantity || 0)), 0);
  const grnReceived = receivedQty ?? items.reduce((s: number, i: any) => s + (Number(i.receivedQuantity || 0)), 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
      <div className="p-6">
        {/* Document Selector if multiple */}
        {docsList.length > 1 && (
          <div className="mb-4 pb-3 border-b border-slate-100">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Select Document ({docsList.length} total)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {docsList.map((d, i) => (
                <button
                  key={d._id || i}
                  onClick={() => onSelectDoc && onSelectDoc(i)}
                  className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-all ${
                    selectedIndex === i
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isInvoice ? d.invoiceNumber : isGrn ? d.grnNumber : d.poNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {isPo ? 'Purchase Order' : isInvoice ? 'Fulfillment Invoice' : 'Delivery GRN'}
            </span>
            <h2 className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {isInvoice ? invDoc.invoiceNumber : isGrn ? grnDoc.grnNumber : poDoc.poNumber}
            </h2>
          </div>
          <div className={`p-2 rounded-lg ${isPo ? 'bg-indigo-50 text-indigo-600' : isInvoice ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isPo ? <FileText className="w-5 h-5" /> : isInvoice ? <Receipt className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
        </div>

        {/* Common Fields */}
        <div className="space-y-2 text-sm">
          <Row icon={<Hash className="w-3.5 h-3.5" />} label="Reference PO" value={(doc as any).poNumber} mono />
          <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Document Date"
            value={fmtDate(isInvoice ? invDoc.invoiceDate : isGrn ? grnDoc.grnDate : poDoc.poDate)} />

          {/* PO-specific */}
          {isPo && (
            <>
              <Row icon={<Building className="w-3.5 h-3.5" />} label="Vendor" value={poDoc.vendorName || 'N/A'} />
              {paymentTerms && <Row icon={<DollarSign className="w-3.5 h-3.5" />} label="Payment Terms" value={paymentTerms} />}
              {deliveryDate  && <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Expected Delivery" value={fmtDate(deliveryDate)} />}
              {poExpiry      && <Row icon={<Calendar className="w-3.5 h-3.5" />} label="PO Expiry" value={fmtDate(poExpiry)} />}
              {buyerGstin    && <Row icon={<Hash className="w-3.5 h-3.5" />} label="Buyer GSTIN" value={buyerGstin} mono />}
            </>
          )}

          {/* GRN-specific */}
          {isGrn && (
            <>
              {inboundNumber   && <Row icon={<Hash className="w-3.5 h-3.5" />} label="Inbound No." value={inboundNumber} mono />}
              {invoiceRefInGrn && <Row icon={<Receipt className="w-3.5 h-3.5" />} label="Invoice Ref." value={invoiceRefInGrn} mono />}
              <Row icon={<Package className="w-3.5 h-3.5" />} label="Expected Qty"
                value={grnExpected ? `${grnExpected} units` : `${items.length} SKUs`} />
              <Row icon={<Package className="w-3.5 h-3.5" />} label="Received Qty"
                value={grnReceived ? `${grnReceived} units` : '-'}
                valueClass={grnReceived < grnExpected ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'} />
              {buyerGstin && <Row icon={<Hash className="w-3.5 h-3.5" />} label="Buyer GSTIN" value={buyerGstin} mono />}
            </>
          )}

          {/* Invoice-specific */}
          {isInvoice && (
            <>
              {vendorGstin  && <Row icon={<Hash className="w-3.5 h-3.5" />} label="Vendor GSTIN" value={vendorGstin} mono />}
              {buyerGstin   && <Row icon={<Hash className="w-3.5 h-3.5" />} label="Buyer GSTIN"  value={buyerGstin}  mono />}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Summary</p>
                <Row icon={<DollarSign className="w-3.5 h-3.5" />} label="Taxable Value" value={fmt(displayTaxable)} valueClass="font-semibold text-slate-900" />
                <Row icon={<DollarSign className="w-3.5 h-3.5" />} label="CGST (2.5%)"   value={fmt(displayCgst)}    />
                <Row icon={<DollarSign className="w-3.5 h-3.5" />} label="SGST (2.5%)"   value={fmt(displaySgst)}    />
                <div className="flex items-center justify-between py-1.5 bg-indigo-50 rounded px-2">
                  <span className="text-xs font-bold text-indigo-700">Invoice Total</span>
                  <span className="text-sm font-bold text-indigo-900">{fmt(displayTotal)}</span>
                </div>
              </div>
            </>
          )}

          {/* Line item count always */}
          <Row icon={<Layers className="w-3.5 h-3.5" />} label="Line Items"
            value={
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">
                {items.length} items
              </span>
            } />
        </div>

        {/* Raw Gemini Payload */}
        {(doc as any).rawParsed && (
          <details className="mt-5 pt-3 border-t border-slate-100 text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-indigo-600 font-medium">
              View Raw Extraction Payload
            </summary>
            <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded text-[11px] overflow-auto max-h-48 font-mono">
              {JSON.stringify((doc as any).rawParsed, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Inline Line Items Table */}
      {items.length > 0 && (
        <div className="border-t border-slate-200">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {isPo ? 'Ordered Items' : isInvoice ? 'Billed Items' : 'Received Items'}
            </span>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold text-slate-600">Item Code</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-600">Description</th>
                  {isPo     && <th className="py-2 px-3 text-right font-semibold text-slate-600">Ordered Qty</th>}
                  {isGrn    && <th className="py-2 px-3 text-right font-semibold text-slate-600">Received Qty</th>}
                  {isInvoice && <th className="py-2 px-3 text-right font-semibold text-slate-600">Qty</th>}
                  {isInvoice && <th className="py-2 px-3 text-right font-semibold text-slate-600">Rate</th>}
                  {(isGrn || isInvoice) && <th className="py-2 px-3 text-right font-semibold text-slate-600">MRP</th>}
                  {isInvoice && <th className="py-2 px-3 text-right font-semibold text-slate-600">Amount</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: any, idx: number) => {
                  const qty     = isGrn ? (item.receivedQuantity ?? 0) : (item.quantity ?? 0);
                  const rate    = item.unitRate ?? null;
                  const mrp     = item.mrp ?? null;
                  const amount  = isInvoice && rate != null ? qty * rate : null;

                  return (
                    <tr key={item._id || idx} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-mono text-slate-700">{item.itemCode}</td>
                      <td className="py-1.5 px-3 text-slate-600 max-w-[160px] truncate" title={item.description}>
                        {item.description || '-'}
                      </td>
                      {(isPo || isGrn || isInvoice) && (
                        <td className="py-1.5 px-3 text-right font-medium text-slate-800">{qty}</td>
                      )}
                      {isInvoice && rate != null && (
                        <td className="py-1.5 px-3 text-right text-slate-700">₹{rate.toFixed(2)}</td>
                      )}
                      {isInvoice && rate == null && (
                        <td className="py-1.5 px-3 text-right text-slate-400">-</td>
                      )}
                      {(isGrn || isInvoice) && (
                        <td className="py-1.5 px-3 text-right text-slate-700">
                          {mrp != null ? `₹${mrp.toFixed(2)}` : '-'}
                        </td>
                      )}
                      {isInvoice && (
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-900">
                          {amount != null ? `₹${amount.toFixed(2)}` : '-'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helper row component ──────────────────────────────────────────────────────
function Row({
  icon,
  label,
  value,
  mono = false,
  valueClass = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50">
      <span className="text-slate-500 flex items-center gap-1.5 text-xs shrink-0 mr-2">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </span>
      <span className={`text-right text-xs ${mono ? 'font-mono font-semibold text-slate-800' : 'text-slate-700 font-medium'} ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
