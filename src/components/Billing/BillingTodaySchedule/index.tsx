'use client';

import './billingTodaySchedule.scss';

import { useMemo, useState } from 'react';

import { TodayScheduleBilling } from '@components/TodaySchedule/TodayScheduleBilling';

import { BillingPageShell } from '../BillingPageShell';
import { formatYmdLong, localTodayYmd } from '../billingShared';
import { useBillingShell } from '../BillingShellContext';

export function BillingTodaySchedule() {
  const shell = useBillingShell();
  const { ready, selectedBranch, selectedBranchId, userName, userEmail } = shell;
  const [scheduleDateYmd, setScheduleDateYmd] = useState(localTodayYmd);

  const subtitle = useMemo(() => {
    const branchName = selectedBranch?.branchName || 'your branch';
    const dateLabel = formatYmdLong(scheduleDateYmd);
    return `Delivery orders on ${dateLabel} at ${branchName}.`;
  }, [scheduleDateYmd, selectedBranch?.branchName]);

  if (!ready) return null;

  return (
    <BillingPageShell
      title="Delivery schedule"
      subtitle={subtitle}
      userName={userName || 'User'}
      userEmail={userEmail || ''}
    >
      <TodayScheduleBilling
        branchLabel={selectedBranch?.branchName || '—'}
        branchId={selectedBranchId}
        scheduleDateYmd={scheduleDateYmd}
        onScheduleDateYmdChange={setScheduleDateYmd}
      />
    </BillingPageShell>
  );
}
