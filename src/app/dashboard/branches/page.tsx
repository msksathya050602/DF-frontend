"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  Branch,
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from "@/services/api/branches";

import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");

  const reload = useCallback(async () => {
    const data = await getBranches();
    setBranches(data.branches || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const handleCreateBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branchName.trim()) return;
    await runAction(async () => {
      await createBranch({
        branchName: branchName.trim(),
        branchAddress: branchAddress.trim() || undefined,
        branchPhone: branchPhone.trim() || undefined,
      });
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
    }, "Branch created successfully.");
  };

  const editBranch = async (branch: Branch) => {
    const currentAddress = branch.branchAddress || "";
    const currentPhone = branch.branchPhone || "";
    const nextName = window.prompt("Branch name", branch.branchName) ?? branch.branchName;
    const nextAddress = window.prompt("Branch address", currentAddress) ?? currentAddress;
    const nextPhone = window.prompt("Branch phone", currentPhone) ?? currentPhone;
    await runAction(
      async () =>
        updateBranch(branch.id, {
          branchName: nextName.trim() || branch.branchName,
          branchAddress: nextAddress.trim() || undefined,
          branchPhone: nextPhone.trim() || undefined,
        }),
      "Branch updated successfully.",
    );
  };

  const removeBranch = async (id: string) => {
    if (!window.confirm("Delete this branch?")) return;
    await runAction(async () => deleteBranch(id), "Branch deleted successfully.");
  };

  return (
    <section className="dashboard-card">
      <h2>Branches</h2>
      {actionMessage && <p className="info-text">{actionMessage}</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      <form className="branch-form" onSubmit={handleCreateBranch}>
        <input
          type="text"
          placeholder="Branch name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Branch address"
          value={branchAddress}
          onChange={(e) => setBranchAddress(e.target.value)}
        />
        <input type="text" placeholder="Branch phone" value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} />
        <button type="submit" disabled={isActing}>
          Create
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Branch</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
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
              <td className="actions-cell">
                <button type="button" onClick={() => void editBranch(row)} disabled={isActing}>
                  Edit
                </button>
                <button type="button" onClick={() => void removeBranch(row.id)} disabled={isActing}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!branches.length && !isLoading && (
            <tr>
              <td colSpan={5}>No branches found</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
