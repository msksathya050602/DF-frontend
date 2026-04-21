'use client';

import { ROUTES } from '@constants/routes';
import AppDropdown from '@library/AppDropdown';
import { BarChart3, Calendar, FilePlus, History, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useBillingShell } from './BillingShellContext';

const nav = [
  { href: ROUTES.BILLING_TODAY, label: 'Today schedule', icon: 'calendar' as const },
  { href: ROUTES.BILLING_NEW, label: 'New bill', icon: 'bill' as const },
  { href: ROUTES.BILLING_ORDER_HISTORY, label: 'Order history', icon: 'history' as const },
  { href: ROUTES.BILLING_ANALYTICS, label: 'Analytics', icon: 'analytics' as const },
  { href: ROUTES.BILLING_SETTINGS, label: 'Settings', icon: 'settings' as const },
];

export function BillingShell() {
  const pathname = usePathname();
  const { branches, selectedBranchId, selectBranch, logout } = useBillingShell();

  return (
    <aside className="billing-sidebar">
      <div>
        <div className="billing-brand">
          <div className="billing-brandIcon">DF</div>
          <div>
            <p className="billing-brandTitle">Daily Fresh</p>
          </div>
        </div>

        <div className="billing-sidebarBranch">
          <label className="billing-sidebarBranch-label" htmlFor="sidebar-branch-select">
            Branch
          </label>
          <div className="billing-sidebarBranch-box">
            <AppDropdown
              id="sidebar-branch-select"
              className="appDropdown--fill"
              value={selectedBranchId}
              onChange={selectBranch}
              listTitle="Select branch"
              placeholder="Select branch"
              allowEmpty
              emptyLabel="Select branch"
              menuMinWidth={240}
              triggerClassName="billing-sidebarBranch-display"
              options={branches.map((item) => ({
                value: item.id,
                label: item.branchName,
                description: item.branchAddress?.trim() || 'Billing location',
              }))}
              renderTrigger={(sel, isOpen) => (
                <>
                  <div className="billing-sidebarBranch-main">
                    <Image
                      src="/icons/sidebar/location.svg"
                      alt=""
                      width={22}
                      height={22}
                      className="billing-sidebarBranch-locationIcon"
                      aria-hidden
                      unoptimized
                    />
                    <div className="billing-sidebarBranch-text">
                      <p className="billing-sidebarBranch-name">{sel?.label ?? 'Select branch'}</p>
                      <p className="billing-sidebarBranch-sub">
                        {sel?.description ?? 'Choose location'}
                      </p>
                    </div>
                  </div>
                  <span className={`appDropdown-chevron ${isOpen ? 'isOpen' : ''}`} aria-hidden />
                </>
              )}
            />
          </div>
        </div>

        <nav className="billing-nav" aria-label="Workspace">
          {nav.map((item) => {
            const isActive =
              item.href === ROUTES.BILLING_NEW
                ? pathname === ROUTES.BILLING_NEW
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={isActive ? 'active' : ''}>
                {item.icon === 'bill' && (
                  <Image
                    src="/icons/sidebar/bill.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="billing-nav-billIcon"
                    aria-hidden
                    unoptimized
                  />
                )}
                {item.icon === 'history' && <History size={18} strokeWidth={2} aria-hidden />}
                {item.icon === 'calendar' && <Calendar size={18} strokeWidth={2} aria-hidden />}
                {item.icon === 'analytics' && <BarChart3 size={18} strokeWidth={2} aria-hidden />}
                {item.icon === 'settings' && <Settings size={18} strokeWidth={2} aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="billing-sidebarFoot">
        <button type="button" className="billing-logout" onClick={logout}>
          <LogOut size={18} strokeWidth={2} aria-hidden />
          Logout
        </button>
      </div>
    </aside>
  );
}
