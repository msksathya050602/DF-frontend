'use client';

import { BillingPageShell } from '../BillingPageShell';
import { AnalyticsView } from '../Analytics/AnalyticsView';
import { useBillingShell } from '../BillingShellContext';

export function BillingAnalytics() {
  const shell = useBillingShell();
  const { ready, selectedBranchId, selectedBranch, userName, userEmail } = shell;

  if (!ready) return null;

  const branchName = selectedBranch?.branchName || 'your branch';

  return (
    <BillingPageShell
      title="Analytics"
      subtitle={`Performance and revenue for ${branchName}. Change branch in the sidebar to compare locations.`}
      userName={userName || 'User'}
      userEmail={userEmail || ''}
    >
      <AnalyticsView
        variant="billing"
        billingBranchId={selectedBranchId}
        billingBranchName={branchName}
      />
    </BillingPageShell>
  );
}
