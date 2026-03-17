"use client";

import "./dashboard.scss";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getStorageKey, LocalStorage, removeStorageKey } from "@/helpers/storage";
import { ROUTES } from "@/routes";
import { getCurrentUser } from "@/services/api/auth";
import { Branch, createBranch, getBranches } from "@/services/api/branches";

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [branchCreateMessage, setBranchCreateMessage] = useState("");

  const loadBranches = async () => {
    const branchData = await getBranches();
    setBranches(branchData.branches || []);
  };

  useEffect(() => {
    const token = getStorageKey(LocalStorage.ACCESS_TOKEN);

    if (!token) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const meData = await getCurrentUser();
        const hasAdminRole = (meData.roles || []).some((role) =>
          role.replace(/[[\]"]/g, "").trim().toLowerCase().includes("admin"),
        );
        if (!hasAdminRole) {
          router.replace(ROUTES.LOGIN);
          return;
        }
        setAdminName(meData.userName || "Admin");
        setAdminEmail(meData.email || "");
        await loadBranches();
        setIsAdmin(true);
        setIsReady(true);
      } catch (_error) {
        setLoadError("Failed to load dashboard data.");
        router.replace(ROUTES.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const logout = () => {
    removeStorageKey(LocalStorage.ACCESS_TOKEN);
    removeStorageKey(LocalStorage.REFRESH_TOKEN);
    router.replace(ROUTES.LOGIN);
  };

  const handleCreateBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branchName.trim()) {
      setBranchCreateMessage("Branch name is required.");
      return;
    }

    try {
      setIsCreatingBranch(true);
      setBranchCreateMessage("");
      await createBranch({
        branchName: branchName.trim(),
        branchAddress: branchAddress.trim() || undefined,
        branchPhone: branchPhone.trim() || undefined,
      });
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      await loadBranches();
      setBranchCreateMessage("Branch created successfully.");
    } catch (_error) {
      setBranchCreateMessage("Failed to create branch.");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  if (!isReady || !isAdmin) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>{adminName ? `${adminName} (${adminEmail})` : "Loading admin details..."}</p>
        </div>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="dashboard-stats">
        <article className="stat-card">
          <h3>Total Active Branches</h3>
          <p>{branches.length}</p>
        </article>
      </section>

      <section className="dashboard-card">
        <h2>Add Branch</h2>
        <form className="branch-form" onSubmit={handleCreateBranch}>
          <input
            type="text"
            placeholder="Branch name"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Branch address"
            value={branchAddress}
            onChange={(event) => setBranchAddress(event.target.value)}
          />
          <input
            type="text"
            placeholder="Branch phone"
            value={branchPhone}
            onChange={(event) => setBranchPhone(event.target.value)}
          />
          <button type="submit" disabled={isCreatingBranch}>
            {isCreatingBranch ? "Saving..." : "Add Branch"}
          </button>
        </form>
        {branchCreateMessage && <p>{branchCreateMessage}</p>}
      </section>

      <section className="dashboard-card">
        <h2>Branch List</h2>
        {loadError && <p>{loadError}</p>}
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((row) => (
              <tr key={row.id}>
                <td>{row.branchName}</td>
                <td>{row.branchAddress || "-"}</td>
                <td>{row.branchPhone || "-"}</td>
                <td>
                  <span className={`status-badge ${row.isActive ? "active" : "inactive"}`}>
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {!branches.length && !isLoading && (
              <tr>
                <td colSpan={4}>No branches found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
