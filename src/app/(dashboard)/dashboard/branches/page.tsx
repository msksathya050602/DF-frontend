'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import {
  Branch,
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from '@/services/api/branches';

import { AdminDeleteModal, AdminEditModal } from '../_lib/adminModals';
import { useAdminAction } from '../_lib/useAdminAction';

export default function DashboardBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [deleteBranchId, setDeleteBranchId] = useState<string | null>(null);

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
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
    }, 'Branch created successfully.');
  };

  const openEditModal = (branch: Branch) => {
    setEditFormError('');
    setEditBranch(branch);
    setEditName(branch.branchName);
    setEditAddress(branch.branchAddress || '');
    setEditPhone(branch.branchPhone || '');
  };

  const closeEditModal = () => {
    setEditBranch(null);
    setEditName('');
    setEditAddress('');
    setEditPhone('');
    setEditFormError('');
  };

  const submitEditBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editBranch) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditFormError('Enter a branch name.');
      return;
    }
    setEditFormError('');
    const br = editBranch;
    const nextAddress = editAddress.trim() || undefined;
    const nextPhone = editPhone.trim() || undefined;
    closeEditModal();
    await runAction(
      async () =>
        updateBranch(br.id, {
          branchName: trimmedName,
          branchAddress: nextAddress,
          branchPhone: nextPhone,
        }),
      'Branch updated successfully.'
    );
  };

  const closeDeleteModal = () => setDeleteBranchId(null);

  const confirmDeleteBranch = async () => {
    if (!deleteBranchId) return;
    const id = deleteBranchId;
    closeDeleteModal();
    await runAction(async () => deleteBranch(id), 'Branch deleted successfully.');
  };

  return (
    <>
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
          <input
            type="text"
            placeholder="Branch phone"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
          />
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
                <td>{row.branchAddress || '-'}</td>
                <td>{row.branchPhone || '-'}</td>
                <td>
                  <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button type="button" onClick={() => openEditModal(row)} disabled={isActing}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteBranchId(row.id)}
                    disabled={isActing}
                  >
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

      <AdminEditModal
        isOpen={!!editBranch}
        title="Edit branch"
        formError={editFormError}
        isActing={isActing}
        onClose={closeEditModal}
        onSubmit={submitEditBranch}
      >
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Branch name</span>
          <input
            type="text"
            autoComplete="organization"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editFormError) setEditFormError('');
            }}
            placeholder="Branch name"
          />
        </label>
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Address</span>
          <input
            type="text"
            autoComplete="street-address"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
            placeholder="Branch address"
          />
        </label>
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Phone</span>
          <input
            type="text"
            autoComplete="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="Branch phone"
          />
        </label>
      </AdminEditModal>

      <AdminDeleteModal
        isOpen={!!deleteBranchId}
        title="Delete this branch?"
        description="Orders and billing data tied to this branch may be affected. Only delete if you are sure."
        isActing={isActing}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBranch}
      />
    </>
  );
}
