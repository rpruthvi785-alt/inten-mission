'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/Navbar';
import { TabsNavigation } from '../../components/TabsNavigation';
import { StatusBanner } from '../../components/StatusBanner';
import { DocumentDetails } from '../../components/DocumentDetails';
import { PdfViewer } from '../../components/PdfViewer';
import { ItemGrid } from '../../components/ItemGrid';
import { SummaryCards } from '../../components/SummaryCards';
import { UploadModal } from '../../components/UploadModal';
import { SkuMasterModal } from '../../components/SkuMasterModal';
import { fetchMatchResult, fetchSummary } from '../../lib/api';
import { ActiveTab, MatchResult, PoSummary } from '../../types';
import { Loader2, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [poNumber, setPoNumber] = useState<string>('CI4PO05788');
  const [activeTab, setActiveTab] = useState<ActiveTab>('po');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isSkuModalOpen, setIsSkuModalOpen] = useState<boolean>(false);
  const [selectedUnmappedSku, setSelectedUnmappedSku] = useState<string>('');

  const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState<number>(0);
  const [selectedGrnIndex, setSelectedGrnIndex] = useState<number>(0);

  // Auth guard
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Query: Three-Way Match Result
  const {
    data: matchData,
    isLoading: isMatchLoading,
    isRefetching: isMatchRefetching,
    refetch: refetchMatch,
    error: matchError,
  } = useQuery<MatchResult>({
    queryKey: ['match', poNumber],
    queryFn: () => fetchMatchResult(poNumber),
    enabled: !!poNumber.trim(),
  });

  // Query: Executive Summary
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    error: summaryError,
  } = useQuery<PoSummary>({
    queryKey: ['summary', poNumber],
    queryFn: () => fetchSummary(poNumber),
    enabled: !!poNumber.trim(),
  });

  const handleRefreshAll = () => {
    refetchMatch();
    refetchSummary();
  };

  const handleUploadSuccess = (uploadedPoNumber?: string) => {
    if (uploadedPoNumber && uploadedPoNumber !== poNumber) {
      setPoNumber(uploadedPoNumber);
    }
    handleRefreshAll();
  };

  const handleOpenMapSku = (skuCode: string) => {
    setSelectedUnmappedSku(skuCode);
    setIsSkuModalOpen(true);
  };

  const posList = matchData?.documents?.pos || (matchData?.documents?.po ? [matchData.documents.po] : []);
  const grnsList = matchData?.documents?.grns || [];
  const invoicesList = matchData?.documents?.invoices || [];

  const currentPoDoc = posList[0] || null;
  const currentGrnDoc = grnsList[selectedGrnIndex] || grnsList[0] || null;
  const currentInvoiceDoc = invoicesList[selectedInvoiceIndex] || invoicesList[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        poNumber={poNumber}
        setPoNumber={setPoNumber}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Tabs Navigation (Purchase Order, Fulfillment, Delivery, Summary) */}
      <TabsNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          po: posList.length,
          fulfillment: invoicesList.length,
          delivery: grnsList.length,
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* PO Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Order:</span>
              <span className="font-mono font-bold text-slate-900 text-lg">{poNumber || 'N/A'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor: <strong className="text-slate-700">{currentPoDoc?.vendorName || 'Hindustan Consumer Supplies Ltd'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isMatchRefetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMatchRefetching ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Recompute Match</span>
            </button>
          </div>
        </div>

        {/* Global Status Banner */}
        {matchData && (
          <StatusBanner
            status={matchData.status}
            statusLabel={matchData.statusLabel}
            reasons={matchData.reasons}
            conflicts={matchData.conflicts}
            warnings={matchData.warnings}
            dateFlow={matchData.dateFlow}
            poNumber={poNumber}
          />
        )}

        {isMatchLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Recomputing Three-Way Match...</p>
          </div>
        ) : matchError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-rose-700 text-sm">
            Failed to load match result: {(matchError as any).message}
          </div>
        ) : (
          <>
            {/* TAB 1: Purchase Order */}
            {activeTab === 'po' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Details */}
                  <div className="lg:col-span-5">
                    <DocumentDetails
                      type="po"
                      doc={currentPoDoc}
                      docsList={posList}
                    />
                  </div>
                  {/* Right Column: PDF/Image Preview */}
                  <div className="lg:col-span-7">
                    <PdfViewer
                      documentId={currentPoDoc?._id}
                      fileName={currentPoDoc?.fileName || 'PurchaseOrder.pdf'}
                      filePath={currentPoDoc?.filePath}
                    />
                  </div>
                </div>

                {/* Bottom Item Grid */}
                <ItemGrid
                  items={matchData?.items || []}
                  onOpenSkuMasterModal={handleOpenMapSku}
                />
              </div>
            )}

            {/* TAB 2: Fulfillment (Invoices) */}
            {activeTab === 'fulfillment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5">
                    <DocumentDetails
                      type="fulfillment"
                      doc={currentInvoiceDoc}
                      docsList={invoicesList}
                      selectedIndex={selectedInvoiceIndex}
                      onSelectDoc={setSelectedInvoiceIndex}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <PdfViewer
                      documentId={currentInvoiceDoc?._id}
                      fileName={currentInvoiceDoc?.fileName || 'Invoice.pdf'}
                      filePath={currentInvoiceDoc?.filePath}
                    />
                  </div>
                </div>

                <ItemGrid
                  items={matchData?.items || []}
                  onOpenSkuMasterModal={handleOpenMapSku}
                />
              </div>
            )}

            {/* TAB 3: Delivery (GRNs) */}
            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5">
                    <DocumentDetails
                      type="delivery"
                      doc={currentGrnDoc}
                      docsList={grnsList}
                      selectedIndex={selectedGrnIndex}
                      onSelectDoc={setSelectedGrnIndex}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <PdfViewer
                      documentId={currentGrnDoc?._id}
                      fileName={currentGrnDoc?.fileName || 'GRN.pdf'}
                      filePath={currentGrnDoc?.filePath}
                    />
                  </div>
                </div>

                <ItemGrid
                  items={matchData?.items || []}
                  onOpenSkuMasterModal={handleOpenMapSku}
                />
              </div>
            )}

            {/* TAB 4: Summary */}
            {activeTab === 'summary' && (
              isSummaryLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm font-medium">Loading executive summary...</p>
                </div>
              ) : summaryError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-rose-700 text-sm">
                  Failed to load executive summary: {(summaryError as any).message}
                </div>
              ) : summaryData ? (
                <SummaryCards summary={summaryData} />
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                  No summary data available for PO <span className="font-mono font-bold">{poNumber}</span>.
                </div>
              )
            )}

          </>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* SKU Master Modal for Quick Mapping */}
      <SkuMasterModal
        isOpen={isSkuModalOpen}
        onClose={() => setIsSkuModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['skus'] });
          handleRefreshAll();
        }}
        defaultErpCode={selectedUnmappedSku}
      />
    </div>
  );
}
