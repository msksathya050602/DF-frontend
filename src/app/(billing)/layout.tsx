'use client';

import '@components/Billing/billing.scss';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { BillingShell } from '@components/Billing/BillingShell';
import { BillingShellProvider } from '@components/Billing/BillingShellContext';

export default function BillingGroupLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 30 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BillingShellProvider>
        <main className="billing-page">
          <div className="billing-appShell">
            <BillingShell />
            {children}
          </div>
        </main>
      </BillingShellProvider>
    </QueryClientProvider>
  );
}
