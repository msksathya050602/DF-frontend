"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AppDropdown from "@library/AppDropdown";

import { currencyDisplayLabel } from "@/helpers/currencyDisplay";
import type { Pricing, Product, Service } from "@/services/api/catalog";
import {
  createPricing,
  deletePricing,
  getPricing,
  getProducts,
  getServices,
  updatePricing,
} from "@/services/api/catalog";

import { AdminDeleteModal, AdminEditModal } from "../_lib/adminModals";
import { useAdminAction } from "../_lib/useAdminAction";
import { toNumber } from "../_lib/utils";

export default function DashboardPricingPage() {
  const [pricingRows, setPricingRows] = useState<Pricing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pricingProductId, setPricingProductId] = useState("");
  const [pricingServiceId, setPricingServiceId] = useState("");
  const [pricingPrice, setPricingPrice] = useState("");
  const [pricingCurrency, setPricingCurrency] = useState("INR");
  const [pricingDeleteId, setPricingDeleteId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Pricing | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editFormError, setEditFormError] = useState("");

  const reload = useCallback(async () => {
    const [pr, prod, svc] = await Promise.all([getPricing(), getProducts(), getServices()]);
    setPricingRows(pr.pricing || []);
    setProducts(prod.products || []);
    setServices(svc.services || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pricingProductId || !pricingServiceId || !pricingPrice.trim()) return;
    await runAction(async () => {
      await createPricing({
        productId: pricingProductId,
        serviceId: pricingServiceId,
        price: Number(pricingPrice),
        currency: pricingCurrency.trim() || "INR",
      });
      setPricingPrice("");
    }, "Pricing created successfully.");
  };

  const openEditModal = (row: Pricing) => {
    setEditFormError("");
    setEditRow(row);
    setEditPrice(String(row.price));
    setEditCurrency(row.currency || "INR");
  };

  const closeEditModal = () => {
    setEditRow(null);
    setEditPrice("");
    setEditCurrency("");
    setEditFormError("");
  };

  const submitEditPricing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editRow) return;
    const priceNum = Number(editPrice);
    if (!editPrice.trim() || Number.isNaN(priceNum)) {
      setEditFormError("Enter a valid price.");
      return;
    }
    setEditFormError("");
    const row = editRow;
    const currency = editCurrency.trim().toUpperCase() || row.currency;
    closeEditModal();
    await runAction(
      async () =>
        updatePricing(row.id, {
          price: priceNum,
          currency,
        }),
      "Pricing updated successfully.",
    );
  };

  const closeDeleteModal = () => setPricingDeleteId(null);

  const confirmDeletePricing = async () => {
    if (!pricingDeleteId) return;
    const id = pricingDeleteId;
    closeDeleteModal();
    await runAction(async () => deletePricing(id), "Pricing deleted successfully.");
  };

  return (
    <>
      <section className="dashboard-card">
        <h2>Pricing</h2>
        {actionMessage && <p className="info-text">{actionMessage}</p>}
        {loadError && <p className="error-text">{loadError}</p>}
        <form className="branch-form" onSubmit={handleCreate}>
          <AppDropdown
            className="appDropdown--fill"
            value={pricingProductId}
            onChange={setPricingProductId}
            listTitle="Product"
            placeholder="Product"
            allowEmpty
            emptyLabel="Product"
            options={products.map((item) => ({ value: item.id, label: item.productName }))}
          />
          <AppDropdown
            className="appDropdown--fill"
            value={pricingServiceId}
            onChange={setPricingServiceId}
            listTitle="Service"
            placeholder="Service"
            allowEmpty
            emptyLabel="Service"
            options={services.map((item) => ({ value: item.id, label: item.serviceName }))}
          />
          <input value={pricingPrice} onChange={(e) => setPricingPrice(e.target.value)} placeholder="Price" />
          <input value={pricingCurrency} onChange={(e) => setPricingCurrency(e.target.value)} placeholder="Currency" />
          <button type="submit" disabled={isActing}>
            Create
          </button>
        </form>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Service</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pricingRows.map((item) => (
              <tr key={item.id}>
                <td>{item.product?.productName || "-"}</td>
                <td>{item.service?.serviceName || "-"}</td>
                <td>{toNumber(item.price).toFixed(2)}</td>
                <td>{currencyDisplayLabel(item.currency)}</td>
                <td>{item.isActive ? "Active" : "Inactive"}</td>
                <td className="actions-cell">
                  <button type="button" onClick={() => openEditModal(item)} disabled={isActing}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setPricingDeleteId(item.id)} disabled={isActing}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!pricingRows.length && !isLoading && (
              <tr>
                <td colSpan={6}>No pricing rows</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <AdminEditModal
        isOpen={!!editRow}
        title="Edit pricing"
        subtitle={
          editRow ? (
            <p className="dashboard-editModal-meta">
              <strong>{editRow.product?.productName || "—"}</strong>
              <span className="dashboard-editModal-meta-sep">·</span>
              <span>{editRow.service?.serviceName || "—"}</span>
            </p>
          ) : null
        }
        formError={editFormError}
        isActing={isActing}
        onClose={closeEditModal}
        onSubmit={submitEditPricing}
      >
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Price</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={editPrice}
            onChange={(e) => {
              setEditPrice(e.target.value);
              if (editFormError) setEditFormError("");
            }}
            placeholder="0.00"
          />
        </label>
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Currency</span>
          <input
            type="text"
            autoComplete="off"
            value={editCurrency}
            onChange={(e) => setEditCurrency(e.target.value)}
            placeholder="INR"
          />
        </label>
      </AdminEditModal>

      <AdminDeleteModal
        isOpen={!!pricingDeleteId}
        title="Delete this pricing row?"
        description="This removes the price for this product and service. You can add it again later."
        isActing={isActing}
        onClose={closeDeleteModal}
        onConfirm={confirmDeletePricing}
      />
    </>
  );
}
