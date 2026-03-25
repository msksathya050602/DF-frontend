"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import type { Pricing, Product, Service } from "@/services/api/catalog";
import {
  createPricing,
  deletePricing,
  getPricing,
  getProducts,
  getServices,
  updatePricing,
} from "@/services/api/catalog";

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

  const editPricing = async (row: Pricing) => {
    const nextPrice = window.prompt("Price", String(row.price)) ?? String(row.price);
    const nextCurrency = window.prompt("Currency", row.currency) ?? row.currency;
    await runAction(
      async () =>
        updatePricing(row.id, {
          price: Number(nextPrice),
          currency: nextCurrency.trim().toUpperCase() || row.currency,
        }),
      "Pricing updated successfully.",
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this pricing row?")) return;
    await runAction(async () => deletePricing(id), "Pricing deleted successfully.");
  };

  return (
    <section className="dashboard-card">
      <h2>Pricing</h2>
      {actionMessage && <p className="info-text">{actionMessage}</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      <form className="branch-form" onSubmit={handleCreate}>
        <select value={pricingProductId} onChange={(e) => setPricingProductId(e.target.value)}>
          <option value="">Product</option>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.productName}
            </option>
          ))}
        </select>
        <select value={pricingServiceId} onChange={(e) => setPricingServiceId(e.target.value)}>
          <option value="">Service</option>
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.serviceName}
            </option>
          ))}
        </select>
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
              <td>{item.currency}</td>
              <td>{item.isActive ? "Active" : "Inactive"}</td>
              <td className="actions-cell">
                <button type="button" onClick={() => void editPricing(item)} disabled={isActing}>
                  Edit
                </button>
                <button type="button" onClick={() => void remove(item.id)} disabled={isActing}>
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
  );
}
