"use client";

import type { ReactNode } from "react";
import {
  Printer,
  ShoppingCart,
  User,
} from "lucide-react";

import { userInitialsFromDisplayName } from "./billingShared";

export type BillingPageShellProps = {
  title: string;
  subtitle: string;
  userName: string;
  userEmail: string;
  topbarExtraClass?: string;
  /** New bill step tabs (step 1–3) */
  stepTabs?: {
    createStep: 1 | 2 | 3;
    setCreateStep: (step: 1 | 2 | 3) => void;
    selectedCustomerId: string;
    hasCompletedOrderForStep3: boolean;
  };
  screenError?: string;
  screenSuccess?: string;
  hideScreenError?: boolean;
  children: ReactNode;
};

export function BillingPageShell({
  title,
  subtitle,
  userName,
  userEmail,
  topbarExtraClass = "",
  stepTabs,
  screenError,
  screenSuccess,
  hideScreenError = false,
  children,
}: BillingPageShellProps) {
  return (
    <section className="billing-main">
      <header className={`billing-topbar${topbarExtraClass ? ` ${topbarExtraClass}` : ""}`}>
        <div className="billing-topbar-left">
          <h1>{title}</h1>
          <p className="billing-topbar-sub">{subtitle}</p>
        </div>
        {stepTabs ? (
          <nav className="billing-topTabs" aria-label="Bill steps">
            <button
              type="button"
              className={stepTabs.createStep === 1 ? "active" : ""}
              onClick={() => stepTabs.setCreateStep(1)}
            >
              <User size={14} strokeWidth={2} aria-hidden />
              <span className="billing-topTabs-text">Find customer</span>
            </button>
            <button
              type="button"
              className={stepTabs.createStep === 2 ? "active" : ""}
              disabled={!stepTabs.selectedCustomerId}
              onClick={() => {
                if (stepTabs.selectedCustomerId) stepTabs.setCreateStep(2);
              }}
            >
              <ShoppingCart size={14} strokeWidth={2} aria-hidden />
              <span className="billing-topTabs-text">Add items</span>
            </button>
            <button
              type="button"
              className={stepTabs.createStep === 3 ? "active" : ""}
              disabled={!stepTabs.hasCompletedOrderForStep3}
              onClick={() => {
                if (stepTabs.hasCompletedOrderForStep3) stepTabs.setCreateStep(3);
              }}
            >
              <Printer size={14} strokeWidth={2} aria-hidden />
              <span className="billing-topTabs-text">Review and print</span>
            </button>
          </nav>
        ) : null}
        <div className="billing-topbar-right">
          <div className="billing-userChip">
            <span className="billing-userChip-avatar" aria-hidden>
              {userInitialsFromDisplayName(userName || "User")}
            </span>
            <div className="billing-userChip-text">
              <span className="billing-userChip-name">{userName || "User"}</span>
              <span
                className="billing-userChip-email"
                title={userEmail?.trim() ? userEmail.trim() : undefined}
              >
                {userEmail?.trim() || "—"}
              </span>
            </div>
          </div>
          {screenError && !hideScreenError ? (
            <p className="billing-topbar-inlineError" role="alert">
              {screenError}
            </p>
          ) : null}
        </div>
      </header>

      {screenSuccess ? <p className="billing-success">{screenSuccess}</p> : null}

      <div className="billing-mainBody">{children}</div>
    </section>
  );
}
