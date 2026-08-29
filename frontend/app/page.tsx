'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const target = token ? '/dashboard' : '/login';
    const timer = setTimeout(() => {
      router.replace(target);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4 animate-pulse">
        <FileCheck className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Three-Way Match Engine</h1>
      <p className="text-slate-400 text-sm mt-1 max-w-sm">
        Reconciling Purchase Orders, Goods Receipt Notes & Invoices with AI OCR.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening application...</span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

