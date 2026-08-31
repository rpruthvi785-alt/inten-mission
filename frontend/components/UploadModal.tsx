'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileCheck2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadDocumentFile } from '../lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (poNumber?: string) => void;
}

type UploadStep = 'idle' | 'uploading' | 'parsing' | 'mapping' | 'completed' | 'error';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [documentType, setDocumentType] = useState<string>('po');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file to upload (PDF, PNG, JPEG, WEBP)');
      return;
    }

    try {
      setErrorMessage('');
      setStep('uploading');

      // Simulate stepper visuals
      setTimeout(() => setStep('parsing'), 800);
      setTimeout(() => setStep('mapping'), 1800);

      const res = await uploadDocumentFile(file, documentType);
      
      setUploadResult(res);
      setStep('completed');

      setTimeout(() => {
        onUploadSuccess(res.poNumber);
        handleClose();
      }, 1500);
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Failed to upload and parse document');
    }
  };

  const handleClose = () => {
    setFile(null);
    setStep('idle');
    setErrorMessage('');
    setUploadResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Upload Procurement Document</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Extracts data via Gemini OCR & auto-resolves SKUs</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleUpload} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Document Type Selector */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { id: 'po', label: 'Purchase Order', short: 'PO' },
                { id: 'grn', label: 'GRN / Delivery', short: 'GRN' },
                { id: 'invoice', label: 'Invoice', short: 'Invoice' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setDocumentType(t.id)}
                  className={`py-2 px-2 sm:px-3 text-xs font-medium rounded-xl border transition-all text-center min-h-[38px] ${
                    documentType === t.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="inline sm:hidden">{t.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Document File (PDF / Image) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/60">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileCheck2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 mb-1.5" />
                <span className="text-xs sm:text-sm font-medium text-slate-800 break-all px-2">
                  {file ? file.name : 'Click to choose or drag & drop document'}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  PDF, PNG, JPG, JPEG, WEBP (Max 25MB)
                </span>
              </label>
            </div>
          </div>

          {/* Stepper Status Indicators */}
          {step !== 'idle' && (
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Processing Pipeline:</span>
                <span className="capitalize text-indigo-600 font-mono">{step}...</span>
              </div>

              <div className="space-y-1.5">
                <div className={`flex items-center gap-2 ${step === 'uploading' ? 'text-indigo-600 font-medium' : step !== 'error' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step === 'uploading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Uploading...</span>
                </div>

                <div className={`flex items-center gap-2 ${step === 'parsing' ? 'text-indigo-600 font-medium' : step === 'mapping' || step === 'completed' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step === 'parsing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Parsing structured fields with Gemini AI...</span>
                </div>

                <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-indigo-600 font-medium' : step === 'completed' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step === 'mapping' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Mapping SKU Master codes...</span>
                </div>

                {step === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed! Updating Three-Way Match...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Upload & Parsing Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={step === 'uploading' || step === 'parsing' || step === 'mapping' || !file}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {(step === 'uploading' || step === 'parsing' || step === 'mapping') && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>Upload & Process</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
