'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, Loader2 } from 'lucide-react';
import { SkuMaster } from '../types';
import { createSku, updateSku } from '../lib/api';

interface SkuMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: SkuMaster | null;
  defaultErpCode?: string;
}

export const SkuMasterModal: React.FC<SkuMasterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultErpCode = '',
}) => {
  const [formData, setFormData] = useState({
    skuErpCode: '',
    name: '',
    eanCode: '',
    hsnCode: '',
    uom: 'NOS',
    agreedRate: '',
    mrp: '',
    priceTolerance: '0.05',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        skuErpCode: initialData.skuErpCode || '',
        name: initialData.name || '',
        eanCode: initialData.eanCode || '',
        hsnCode: initialData.hsnCode || '',
        uom: initialData.uom || 'NOS',
        agreedRate: initialData.agreedRate !== undefined && initialData.agreedRate !== null ? String(initialData.agreedRate) : '',
        mrp: initialData.mrp !== undefined && initialData.mrp !== null ? String(initialData.mrp) : '',
        priceTolerance: initialData.priceTolerance !== undefined && initialData.priceTolerance !== null ? String(initialData.priceTolerance) : '0.05',
      });
    } else {
      setFormData({
        skuErpCode: defaultErpCode || '',
        name: '',
        eanCode: '',
        hsnCode: '',
        uom: 'NOS',
        agreedRate: '',
        mrp: '',
        priceTolerance: '0.05',
      });
    }
    setError('');
  }, [initialData, defaultErpCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skuErpCode || !formData.name) {
      setError('ERP Code and SKU Name are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        skuErpCode: formData.skuErpCode.trim(),
        name: formData.name.trim(),
        eanCode: formData.eanCode.trim(),
        hsnCode: formData.hsnCode.trim(),
        uom: formData.uom.trim() || 'NOS',
        agreedRate: formData.agreedRate ? parseFloat(formData.agreedRate) : null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        priceTolerance: formData.priceTolerance ? parseFloat(formData.priceTolerance) : 0.05,
      };

      if (initialData && initialData._id) {
        await updateSku(initialData._id, payload);
      } else {
        await createSku(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save SKU Master');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {initialData ? 'Edit SKU Master Record' : 'Create New SKU Master'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                ERP Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.skuErpCode}
                onChange={(e) => setFormData({ ...formData, skuErpCode: e.target.value })}
                placeholder="e.g. SKU-DOVE-180"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                EAN / Barcode
              </label>
              <input
                type="text"
                value={formData.eanCode}
                onChange={(e) => setFormData({ ...formData, eanCode: e.target.value })}
                placeholder="e.g. 8901030383793"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              SKU Name / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dove Intense Repair Shampoo 180ml"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="e.g. 33051090"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                UOM (Unit)
              </label>
              <input
                type="text"
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                placeholder="NOS / PCS / KG"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Agreed Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.agreedRate}
                onChange={(e) => setFormData({ ...formData, agreedRate: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Price Tolerance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.priceTolerance}
                onChange={(e) => setFormData({ ...formData, priceTolerance: e.target.value })}
                placeholder="0.05 (5%)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-2 min-h-[38px]"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Update Record' : 'Save to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

