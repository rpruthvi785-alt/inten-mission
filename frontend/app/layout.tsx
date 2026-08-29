'use client';

import React, { useState } from 'react';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en">
      <head>
        <title>Three-Way Match Engine | PO, GRN & Invoice Reconciliation</title>
        <meta name="description" content="Dynamic Three-Way Match Engine for Purchase Orders, Fulfillment Invoices, and Delivery Goods Receipt Notes with Gemini OCR" />
      </head>
      <body className="bg-slate-50 min-h-screen text-slate-800 antialiased">
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
