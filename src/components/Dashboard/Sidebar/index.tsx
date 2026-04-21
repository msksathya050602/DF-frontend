'use client';

import Link from 'next/link';

import { DASHBOARD_NAV_ITEMS } from '@/constants/dashboardNav';

function linkIsActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DashboardSidebarProps = {
  pathname: string;
  adminName: string;
  adminEmail: string;
};

export function DashboardSidebar({ pathname, adminName, adminEmail }: DashboardSidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div>
        <div className="sidebar-brand">
          <h2>DailyFresh</h2>
          <span className="sidebar-menu-dot">≡</span>
        </div>
        <div className="sidebar-profile">
          <div className="sidebar-avatar">{adminName.slice(0, 1).toUpperCase() || 'A'}</div>
          <p>{adminName || 'Admin'}</p>
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard sections">
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkIsActive(pathname, item.href, item.exact) ? 'active' : ''}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="sidebar-footer">{adminEmail || 'admin@dailyfresh.com'}</p>
    </aside>
  );
}
