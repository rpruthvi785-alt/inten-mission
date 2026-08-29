'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/Navbar';
import { SkuMasterModal } from '../../components/SkuMasterModal';
import { fetchSkus, deleteSku } from '../../lib/api';
import { SkuMaster } from '../../types';
import { Plus, Search, Edit2, Trash2, Database, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SkuMasterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSku, setEditingSku] = useState<SkuMaster | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const { data: skus, isLoading, refetch } = useQuery<SkuMaster[]>({
    queryKey: ['skus', searchTerm],
    queryFn: () => fetchSkus(searchTerm),
  });

  const handleEdit = (sku: SkuMaster) => {
    setEditingSku(sku);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSku(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this SKU Master record?')) return;

    try {
      setDeletingId(id);
      await deleteSku(id);
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      refetch();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        poNumber=""
        setPoNumber={() => {}}
        onOpenUpload={() => router.push('/dashboard')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>SKU Master Catalog</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central ERP & EAN product mapping catalog with price tolerances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU / EAN / Name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU Master</span>
            </button>
          </div>
        </div>

        {/* SKU Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading SKU Master items...</p>
            </div>
          ) : !skus || skus.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No SKU records found. Click &quot;Add SKU Master&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-left">ERP Code</th>
                    <th className="py-3 px-4 text-left">SKU Name</th>
                    <th className="py-3 px-4 text-left">EAN Code</th>
                    <th className="py-3 px-4 text-left">HSN</th>
                    <th className="py-3 px-4 text-center">UOM</th>
                    <th className="py-3 px-4 text-right">Agreed Rate</th>
                    <th className="py-3 px-4 text-right">MRP</th>
                    <th className="py-3 px-4 text-right">Price Tolerance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {skus.map((sku) => (
                    <tr key={sku._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {sku.skuErpCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-[200px] truncate">
                        {sku.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {sku.eanCode || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {sku.hsnCode || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {sku.uom || 'NOS'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {sku.agreedRate !== null && sku.agreedRate !== undefined ? `₹${Number(sku.agreedRate).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {sku.mrp !== null && sku.mrp !== undefined ? `₹${Number(sku.mrp).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {sku.priceTolerance !== undefined ? `${(Number(sku.priceTolerance) * 100).toFixed(0)}%` : '5%'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(sku)}
                            title="Edit SKU"
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sku._id)}
                            disabled={deletingId === sku._id}
                            title="Delete SKU"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SkuMasterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['skus'] });
          refetch();
        }}
        initialData={editingSku}
      />
    </div>
  );
}
