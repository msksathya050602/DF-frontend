'use client';

import '@components/Billing/billing.scss';

import { BillingShell } from '@components/Billing/BillingShell';
import { BillingShellProvider } from '@components/Billing/BillingShellContext';

export default function BillingGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <BillingShellProvider>
      <main className="billing-page">
        <div className="billing-appShell">
          <BillingShell />
          {children}
        </div>
      </main>
    </BillingShellProvider>
  );
}
