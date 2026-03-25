"use client";

import "./dashboard.scss";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getStorageKey, LocalStorage, removeStorageKey } from "@/helpers/storage";
import { ROUTES } from "@constants/routes";
import { getCurrentUser } from "@/services/api/auth";

import { normalizeRoles } from "./_lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: string; exact?: boolean }[] = [
  { href: ROUTES.DASHBOARD, label: "Home", icon: "⌂", exact: true },
  { href: ROUTES.DASHBOARD_PRODUCTS, label: "Products", icon: "◻" },
  { href: ROUTES.DASHBOARD_CATEGORIES, label: "Categories", icon: "◫" },
  { href: ROUTES.DASHBOARD_SERVICES, label: "Services", icon: "⚙" },
  { href: ROUTES.DASHBOARD_PRICING, label: "Pricing", icon: "₹" },
  { href: ROUTES.DASHBOARD_ORDERS, label: "Orders", icon: "⌘" },
  { href: ROUTES.DASHBOARD_BRANCHES, label: "Branches", icon: "⌖" },
];

function linkIsActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initStartedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const token = getStorageKey(LocalStorage.ACCESS_TOKEN);
    if (!token) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    const init = async () => {
      try {
        const meData = await getCurrentUser();
        const hasAdminRole = normalizeRoles(meData.roles).includes("admin");
        if (!hasAdminRole) {
          router.replace(ROUTES.BILLING);
          return;
        }
        setAdminName(meData.userName || "Admin");
        setAdminEmail(meData.email || "");
        setIsReady(true);
      } catch {
        router.replace(ROUTES.LOGIN);
      }
    };

    void init();
  }, [router]);

  const logout = () => {
    removeStorageKey(LocalStorage.ACCESS_TOKEN);
    removeStorageKey(LocalStorage.REFRESH_TOKEN);
    router.replace(ROUTES.LOGIN);
  };

  if (!isReady) return null;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-brand">
            <h2>DailyFresh</h2>
            <span className="sidebar-menu-dot">≡</span>
          </div>
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{adminName.slice(0, 1).toUpperCase() || "A"}</div>
            <p>{adminName || "Admin"}</p>
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard sections">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkIsActive(pathname, item.href, item.exact) ? "active" : ""}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="sidebar-footer">{adminEmail || "admin@dailyfresh.com"}</p>
      </aside>

      <div className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {adminName || "Admin"}</h1>
            <p>Operations overview and management console</p>
          </div>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
