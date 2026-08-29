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
      icon: ShoppingCart,
      badge: counts ? counts.po : undefined,
    },
    {
      id: 'fulfillment' as ActiveTab,
      label: 'Fulfillment',
      icon: Receipt,
      badge: counts ? counts.fulfillment : undefined,
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'Delivery',
      icon: Truck,
      badge: counts ? counts.delivery : undefined,
    },
    {
      id: 'summary' as ActiveTab,
      label: 'Summary',
      icon: BarChart3,
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-4 w-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
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
