'use client';

import React from 'react';
import { ShoppingCart, Receipt, Truck, BarChart3 } from 'lucide-react';
import { ActiveTab } from '../types';

interface TabsNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  counts?: {
    po: number;
    fulfillment: number;
    delivery: number;
  };
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  setActiveTab,
  counts,
}) => {
  const tabs = [
    {
      id: 'po' as ActiveTab,
      label: 'Purchase Order',
      shortLabel: 'PO',
      icon: ShoppingCart,
      badge: counts ? counts.po : undefined,
    },
    {
      id: 'fulfillment' as ActiveTab,
      label: 'Fulfillment (Invoices)',
      shortLabel: 'Invoices',
      icon: Receipt,
      badge: counts ? counts.fulfillment : undefined,
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'Delivery (GRNs)',
      shortLabel: 'GRNs',
      icon: Truck,
      badge: counts ? counts.delivery : undefined,
    },
    {
      id: 'summary' as ActiveTab,
      label: 'Summary & Stats',
      shortLabel: 'Summary',
      icon: BarChart3,
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white sticky top-16 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <nav 
          className="flex space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar scroll-smooth py-0.5" 
          aria-label="Procurement Reconciliation Tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group shrink-0 inline-flex items-center py-3 sm:py-4 px-2.5 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap min-h-[44px] ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-1.5 sm:mr-2 h-4 w-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-semibold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

