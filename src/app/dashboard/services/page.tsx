"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { createService, deleteService, getServices, Service, updateService } from "@/services/api/catalog";

import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceName, setServiceName] = useState("");

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

  const editService = async (service: Service) => {
    const nextName = window.prompt("Service name", service.serviceName) ?? service.serviceName;
    await runAction(
      async () =>
        updateService(service.id, {
          serviceName: nextName.trim() || service.serviceName,
        }),
      "Service updated successfully.",
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this service?")) return;
    await runAction(async () => deleteService(id), "Service deleted successfully.");
  };

  return (
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
                <button type="button" onClick={() => void editService(item)} disabled={isActing}>
                  Edit
                </button>
                <button type="button" onClick={() => void remove(item.id)} disabled={isActing}>
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
  );
}
