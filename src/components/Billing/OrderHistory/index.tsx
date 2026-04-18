"use client";

import "./orderHistory.scss";

import { useEffect, useMemo, useState } from "react";

import { currencyDisplayLabel } from "@/helpers/currencyDisplay";
import { getOrders, type Order } from "@/services/api/orders";

import { BillingPageShell } from "../BillingPageShell";
import {
  formatOrderDate,
  orderStatusChipClass,
  paymentStatusChipClass,
  toNumber,
} from "../billingShared";
import { useBillingShell } from "../BillingShellContext";

export function OrderHistory() {
  const shell = useBillingShell();
  const { selectedBranchId, selectedBranch, userName, userEmail } = shell;
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const branchOrders = useMemo(
    () => orders.filter((order) => !selectedBranchId || order.branchId === selectedBranchId),
    [orders, selectedBranchId],
  );

  useEffect(() => {
    if (!shell.ready) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await getOrders();
        if (!cancelled) setOrders(response.orders || []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setWorkspaceReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell.ready]);

  if (!shell.ready || !workspaceReady) return null;

  return (
    <BillingPageShell
      title="Order history"
      subtitle={`Orders at ${selectedBranch?.branchName || "the branch you selected"}.`}
      userName={userName || "User"}
      userEmail={userEmail || ""}
    >
      <section className="billing-card billing-history">
        <p className="billing-history-hint billing-muted">Branch: {selectedBranch?.branchName || "—"}</p>
        <div className="history-cards">
          {branchOrders.map((order) => (
            <article key={order.id} className="history-card">
              <div className="history-card-head">
                <h3 className="history-card-orderId">{order.orderNumber}</h3>
                <time className="history-card-time" dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleString()}
                </time>
                <div className="history-chip-wrap">
                  <span className={`history-chip ${orderStatusChipClass(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className={`history-chip ${paymentStatusChipClass(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="history-meta-inline">
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Customer</span>
                  <span className="history-meta-val">
                    {`${order.customer?.firstName || "-"}${order.customer?.lastName ? ` ${order.customer.lastName}` : ""}`}
                  </span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Phone</span>
                  <span className="history-meta-val">{order.customer?.customerPhone || "—"}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Branch</span>
                  <span className="history-meta-val">{order.branch?.branchName || selectedBranch?.branchName || "—"}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Delivery date</span>
                  <span className="history-meta-val">{formatOrderDate(order.deliveryDate ?? null)}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Items</span>
                  <span className="history-meta-val">{order.items?.length ?? 0}</span>
                </span>
              </div>

              <table className="history-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.productName || "-"}</td>
                      <td>{item.service?.serviceName || "-"}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {currencyDisplayLabel("INR")} {toNumber(item.unitPrice).toFixed(2)}
                      </td>
                      <td>
                        {currencyDisplayLabel("INR")} {toNumber(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {!order.items?.length && (
                    <tr>
                      <td colSpan={5}>No item rows available.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="history-total-inline">
                <span className="history-total-pair">
                  <span className="history-total-lbl">Sub</span>
                  <strong className="history-total-amt">
                    {currencyDisplayLabel("INR")} {toNumber(order.subTotal).toFixed(2)}
                  </strong>
                </span>
                <span className="history-total-pair">
                  <span className="history-total-lbl">Discount</span>
                  <strong className="history-total-amt">
                    {currencyDisplayLabel("INR")} {toNumber(order.discountAmount).toFixed(2)}
                  </strong>
                </span>
                <span className="history-total-pair">
                  <span className="history-total-lbl">Tax</span>
                  <strong className="history-total-amt">
                    {currencyDisplayLabel("INR")} {toNumber(order.taxAmount).toFixed(2)}
                  </strong>
                </span>
                <span className="history-total-pair history-total-pair--grand">
                  <span className="history-total-lbl">Total</span>
                  <strong className="history-total-amt">
                    {currencyDisplayLabel("INR")} {toNumber(order.totalAmount).toFixed(2)}
                  </strong>
                </span>
              </div>
            </article>
          ))}
          {!branchOrders.length && <p className="billing-muted">No orders found for selected branch.</p>}
        </div>
      </section>
    </BillingPageShell>
  );
}
