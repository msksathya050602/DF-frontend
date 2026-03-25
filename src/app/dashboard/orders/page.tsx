"use client";

import { useCallback, useEffect, useState } from "react";

import { currencyDisplayLabel } from "@/helpers/currencyDisplay";
import type { Order } from "@/services/api/orders";
import {
  cancelOrder,
  getOrders,
  updateOrderItemStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/services/api/orders";

import { useAdminAction } from "../_lib/useAdminAction";
import { toNumber } from "../_lib/utils";

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getOrders();
    setOrders(data.orders || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const patchOrderStatus = async (orderId: string, orderStatus: string) => {
    await runAction(async () => updateOrderStatus(orderId, { orderStatus }), "Order status updated.");
  };

  const patchPaymentStatus = async (orderId: string, paymentStatus: string) => {
    await runAction(async () => updatePaymentStatus(orderId, { paymentStatus }), "Payment status updated.");
  };

  const patchOrderItemStatus = async (itemId: string, itemStatus: string) => {
    await runAction(async () => updateOrderItemStatus(itemId, { itemStatus }), "Order item status updated.");
  };

  const removeOrder = async (id: string) => {
    if (!window.confirm("Cancel this order?")) return;
    await runAction(async () => cancelOrder(id), "Order cancelled successfully.");
  };

  return (
    <section className="dashboard-card">
      <h2>Orders</h2>
      {actionMessage && <p className="info-text">{actionMessage}</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      {isLoading && <p className="info-text">Loading…</p>}
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Branch</th>
            <th>Order Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{`${order.customer?.firstName || "-"}${order.customer?.lastName ? ` ${order.customer.lastName}` : ""}`}</td>
              <td>{order.branch?.branchName || "-"}</td>
              <td>
                <select
                  value={order.orderStatus}
                  onChange={(e) => void patchOrderStatus(order.id, e.target.value)}
                  disabled={isActing}
                >
                  <option value="CREATED">CREATED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>
              <td>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => void patchPaymentStatus(order.id, e.target.value)}
                  disabled={isActing}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </td>
              <td>
                {currencyDisplayLabel("INR")} {toNumber(order.totalAmount).toFixed(2)}
              </td>
              <td className="actions-cell">
                <button type="button" onClick={() => void removeOrder(order.id)} disabled={isActing}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
          {!orders.length && !isLoading && (
            <tr>
              <td colSpan={7}>No orders</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 8px" }}>Order line items</h3>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Item</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Item status</th>
            </tr>
          </thead>
          <tbody>
            {orders.flatMap((order) =>
              (order.items || []).map((item) => (
                <tr key={item.id}>
                  <td>{order.orderNumber}</td>
                  <td>{item.product?.productName || "-"}</td>
                  <td>{item.service?.serviceName || "-"}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <select
                      value={item.itemStatus}
                      onChange={(e) => void patchOrderItemStatus(item.id, e.target.value)}
                      disabled={isActing}
                    >
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="DONE">DONE</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
                </tr>
              )),
            )}
            {!orders.some((o) => (o.items || []).length) && !isLoading && (
              <tr>
                <td colSpan={5}>No line items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
