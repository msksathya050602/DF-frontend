'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ROUTES } from '@constants/routes';
import { useRouter } from 'next/navigation';

import { getStorageKey, LocalStorage, removeStorageKey, setStorageKey } from '@/helpers/storage';
import { getCurrentUser } from '@/services/api/auth';
import { type Branch, getBranches } from '@/services/api/branches';

export type BillingShellContextValue = {
  ready: boolean;
  branches: Branch[];
  selectedBranchId: string;
  selectBranch: (branchId: string) => void;
  selectedBranch: Branch | null;
  userName: string;
  userEmail: string;
  logout: () => void;
};

const BillingShellContext = createContext<BillingShellContextValue | null>(null);

export function useBillingShell(): BillingShellContextValue {
  const ctx = useContext(BillingShellContext);
  if (!ctx) {
    throw new Error('useBillingShell must be used within BillingShellProvider');
  }
  return ctx;
}

function normalizeRoles(roles: unknown): string[] {
  const list = Array.isArray(roles) ? roles : [];
  return list
    .flatMap((r) => {
      const str = String(r ?? '');
      if (str.includes('[') && str.includes(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          /* ignore */
        }
      }
      return [str];
    })
    .map((r) =>
      String(r)
        .replace(/[[\]"]/g, '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
}

export function BillingShellProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === selectedBranchId) || null,
    [branches, selectedBranchId]
  );

  const selectBranch = useCallback((branchId: string) => {
    setSelectedBranchId(branchId);
    setStorageKey(LocalStorage.SELECTED_BRANCH_ID, branchId);
  }, []);

  const logout = useCallback(() => {
    removeStorageKey(LocalStorage.ACCESS_TOKEN);
    removeStorageKey(LocalStorage.REFRESH_TOKEN);
    removeStorageKey(LocalStorage.SELECTED_BRANCH_ID);
    router.replace(ROUTES.SIGN_IN);
  }, [router]);

  useEffect(() => {
    const init = async () => {
      const token = getStorageKey(LocalStorage.ACCESS_TOKEN);
      if (!token) {
        router.replace(ROUTES.SIGN_IN);
        return;
      }

      try {
        const me = await getCurrentUser();
        normalizeRoles(me.roles);
        setUserName(me.userName || 'User');
        setUserEmail(me.email || '');

        const branchResult = await getBranches();
        const activeBranches = (branchResult.branches || []).filter((item) => item.isActive);
        setBranches(activeBranches);

        const cachedBranch = getStorageKey(LocalStorage.SELECTED_BRANCH_ID);
        if (cachedBranch && activeBranches.some((item) => item.id === cachedBranch)) {
          setSelectedBranchId(cachedBranch);
        } else if (activeBranches.length) {
          setSelectedBranchId(activeBranches[0].id);
        }

        setReady(true);
      } catch {
        router.replace(ROUTES.SIGN_IN);
      }
    };

    void init();
  }, [router]);

  const value: BillingShellContextValue = {
    ready,
    branches,
    selectedBranchId,
    selectBranch,
    selectedBranch,
    userName,
    userEmail,
    logout,
  };

  return <BillingShellContext.Provider value={value}>{children}</BillingShellContext.Provider>;
}
