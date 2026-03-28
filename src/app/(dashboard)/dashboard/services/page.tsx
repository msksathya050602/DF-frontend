"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { createService, deleteService, getServices, Service, updateService } from "@/services/api/catalog";

import { AdminDeleteModal, AdminEditModal } from "../_lib/adminModals";
import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceName, setServiceName] = useState("");
  const [editService, setEditService] = useState<Service | null>(null);
  const [editName, setEditName] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await getServices();
    setServices(data.services || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceName.trim()) return;
    await runAction(async () => {
      await createService({
        serviceName: serviceName.trim(),
      });
      setServiceName("");
    }, "Service created successfully.");
  };

  const openEditModal = (service: Service) => {
    setEditFormError("");
    setEditService(service);
    setEditName(service.serviceName);
  };

  const closeEditModal = () => {
    setEditService(null);
    setEditName("");
    setEditFormError("");
  };

  const submitEditService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editService) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditFormError("Enter a service name.");
      return;
    }
    setEditFormError("");
    const svc = editService;
    closeEditModal();
    await runAction(
      async () =>
        updateService(svc.id, {
          serviceName: trimmed,
        }),
      "Service updated successfully.",
    );
  };

  const closeDeleteModal = () => setDeleteServiceId(null);

  const confirmDeleteService = async () => {
    if (!deleteServiceId) return;
    const id = deleteServiceId;
    closeDeleteModal();
    await runAction(async () => deleteService(id), "Service deleted successfully.");
  };

  return (
    <>
      <section className="dashboard-card">
        <h2>Services</h2>
        {actionMessage && <p className="info-text">{actionMessage}</p>}
        {loadError && <p className="error-text">{loadError}</p>}
        <form className="branch-form" onSubmit={handleCreate}>
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Service name" />
          <button type="submit" disabled={isActing}>
            Create
          </button>
        </form>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((item) => (
              <tr key={item.id}>
                <td>{item.serviceName}</td>
                <td>{item.isActive ? "Active" : "Inactive"}</td>
                <td className="actions-cell">
                  <button type="button" onClick={() => openEditModal(item)} disabled={isActing}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleteServiceId(item.id)} disabled={isActing}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!services.length && !isLoading && (
              <tr>
                <td colSpan={3}>No services</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <AdminEditModal
        isOpen={!!editService}
        title="Edit service"
        formError={editFormError}
        isActing={isActing}
        onClose={closeEditModal}
        onSubmit={submitEditService}
      >
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Service name</span>
          <input
            type="text"
            autoComplete="off"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editFormError) setEditFormError("");
            }}
            placeholder="Service name"
          />
        </label>
      </AdminEditModal>

      <AdminDeleteModal
        isOpen={!!deleteServiceId}
        title="Delete this service?"
        description="This removes the service from the catalog. Related pricing rows may need to be updated."
        isActing={isActing}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteService}
      />
    </>
  );
}
