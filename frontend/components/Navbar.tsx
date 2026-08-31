'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, UploadCloud, Database, LogOut, FileCheck, Menu, X, ArrowLeft, Settings } from 'lucide-react';

interface NavbarProps {
  poNumber: string;
  setPoNumber: (po: string) => void;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  poNumber,
  setPoNumber,
  onOpenUpload,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 font-bold text-base sm:text-lg text-indigo-700 tracking-tight shrink-0"
            >
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="truncate">MatchEngine</span>
            </Link>

            {/* Desktop Search Input */}
            {pathname === '/dashboard' && (
              <div className="hidden md:block relative w-56 lg:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Search PO (e.g. CI4PO05788)"
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            )}
          </div>

          {/* Desktop Navigation Actions */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Link
              href="/masters"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                pathname === '/masters'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>SKU Master</span>
            </Link>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>

            <Link
              href="/settings"
              className={`p-1.5 rounded-lg transition-colors ${
                pathname === '/settings'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Action Controls */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={onOpenUpload}
              className="p-2 text-white bg-indigo-600 rounded-lg shadow-xs hover:bg-indigo-700 transition-all"
              title="Upload Document"
              aria-label="Upload Document"
            >
              <UploadCloud className="w-4 h-4" />
            </button>

            <Link
              href={pathname === '/masters' ? '/dashboard' : '/masters'}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title={pathname === '/masters' ? 'Back to Dashboard' : 'SKU Master Catalog'}
              aria-label="Toggle SKU Master"
            >
              {pathname === '/masters' ? <ArrowLeft className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </Link>

            <Link
              href="/settings"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Directly accessible below header on mobile) */}
        {pathname === '/dashboard' && (
          <div className="md:hidden pb-3 pt-1 border-t border-slate-100">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Search PO (e.g. CI4PO05788)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

