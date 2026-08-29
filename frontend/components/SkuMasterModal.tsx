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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData ? 'Edit SKU Master Record' : 'Create New SKU Master'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                ERP Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.skuErpCode}
                onChange={(e) => setFormData({ ...formData, skuErpCode: e.target.value })}
                placeholder="e.g. SKU-DOVE-180"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                EAN / Barcode
              </label>
              <input
                type="text"
                value={formData.eanCode}
                onChange={(e) => setFormData({ ...formData, eanCode: e.target.value })}
                placeholder="e.g. 8901030383793"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              SKU Name / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dove Intense Repair Shampoo 180ml"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="e.g. 33051090"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                UOM (Unit)
              </label>
              <input
                type="text"
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                placeholder="NOS / PCS / KG"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Agreed Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.agreedRate}
                onChange={(e) => setFormData({ ...formData, agreedRate: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Price Tolerance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.priceTolerance}
                onChange={(e) => setFormData({ ...formData, priceTolerance: e.target.value })}
                placeholder="0.05 (5%)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-200 font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
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
