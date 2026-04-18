"use client";

import "./billingTodaySchedule.scss";

import { TodayScheduleBilling } from "@components/TodaySchedule/TodayScheduleBilling";

import { BillingPageShell } from "../BillingPageShell";
import { useBillingShell } from "../BillingShellContext";

export function BillingTodaySchedule() {
  const shell = useBillingShell();
  const { ready, selectedBranch, userName, userEmail } = shell;

  if (!ready) return null;

  return (
    <BillingPageShell
      title="Today schedule"
      subtitle={`Today’s delivery orders at ${selectedBranch?.branchName || "your branch"}.`}
      userName={userName || "User"}
      userEmail={userEmail || ""}
    >
      <TodayScheduleBilling branchLabel={selectedBranch?.branchName || "—"} />
    </BillingPageShell>
  );
}
