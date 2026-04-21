'use client';

import './layout.scss';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '@components/Dashboard/DashboardHeader';
import { DashboardSidebar } from '@components/Dashboard/Sidebar';
import { ROUTES } from '@constants/routes';
import { usePathname, useRouter } from 'next/navigation';

import { getStorageKey, LocalStorage, removeStorageKey } from '@/helpers/storage';
import { getCurrentUser } from '@/services/api/auth';

import { normalizeRoles } from './dashboard/_lib/utils';

export default function DashboardRouteGroupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initStartedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const token = getStorageKey(LocalStorage.ACCESS_TOKEN);
    if (!token) {
      router.replace(ROUTES.SIGN_IN);
      return;
    }

    const init = async () => {
      try {
        const meData = await getCurrentUser();
        const hasAdminRole = normalizeRoles(meData.roles).includes('admin');
        if (!hasAdminRole) {
          router.replace(ROUTES.BILLING);
          return;
        }
        setAdminName(meData.userName || 'Admin');
        setAdminEmail(meData.email || '');
        setIsReady(true);
      } catch {
        router.replace(ROUTES.SIGN_IN);
      }
    };

    void init();
  }, [router]);

  const logout = () => {
    removeStorageKey(LocalStorage.ACCESS_TOKEN);
    removeStorageKey(LocalStorage.REFRESH_TOKEN);
    router.replace(ROUTES.SIGN_IN);
  };

  if (!isReady) return null;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar pathname={pathname} adminName={adminName} adminEmail={adminEmail} />
      <div className="dashboard-page">
        <DashboardHeader adminName={adminName} onLogout={logout} />
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
