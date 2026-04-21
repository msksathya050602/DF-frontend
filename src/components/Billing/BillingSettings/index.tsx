'use client';

import './billingSettings.scss';

import { ROUTES } from '@constants/routes';
import Link from 'next/link';

import { BillingPageShell } from '../BillingPageShell';
import { useBillingShell } from '../BillingShellContext';

export function BillingSettings() {
  const shell = useBillingShell();
  const { ready, userName, userEmail } = shell;

  if (!ready) return null;

  return (
    <BillingPageShell
      title="Settings"
      subtitle="Admin tools and catalogue management."
      userName={userName || 'User'}
      userEmail={userEmail || ''}
    >
      <section className="billing-card billing-settings">
        <h2 className="billing-step-title">Settings</h2>
        <p className="billing-muted">
          Open the admin dashboard to manage branches, catalogue, pricing, and orders.
        </p>
        <ul className="billing-settings-links">
          <li>
            <Link href={ROUTES.DASHBOARD}>Dashboard home</Link>
          </li>
          <li>
            <Link href={ROUTES.DASHBOARD_BRANCHES}>Branches</Link>
          </li>
          <li>
            <Link href={ROUTES.DASHBOARD_ORDERS}>All orders (admin)</Link>
          </li>
        </ul>
      </section>
    </BillingPageShell>
  );
}
