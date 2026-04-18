"use client";

import { useCallback, useEffect, useState } from "react";
import AppDropdown from "@library/AppDropdown";
import { ChevronDown, ChevronRight } from "lucide-react";

import { toNumber } from "@/app/(dashboard)/dashboard/_lib/utils";
import { currencyDisplayLabel } from "@/helpers/currencyDisplay";
import { useAdminAction } from "@/hooks/useAdminAction";
import { getTodayDeliveries, updateDeliveryOrderStatus } from "@/services/api/deliveries";
import type { Order } from "@/services/api/orders";

type RowDraft = {
  orderStatus: string;
  paymentStatus: string;
  handledBy: string;
};

const defaultOrderStatuses = ["PENDING", "DELIVERED", "CANCELLED"];
const defaultPaymentStatuses = ["PENDING", "PAID", "PARTIAL", "REFUNDED"];

const orderStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === "DELIVERED") return "history-chip--tone-success";
  if (u === "CANCELLED") return "history-chip--tone-danger";
  return "history-chip--tone-info";
};

const paymentStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === "PAID") return "history-chip--tone-success";
  if (u === "REFUNDED") return "history-chip--tone-muted";
  if (u === "PARTIAL") return "history-chip--tone-warning";
  return "history-chip--tone-warning";
};

export function TodayScheduleBilling({ branchLabel }: { branchLabel: string }) {
  const [meta, setMeta] = useState<{
    orderStatuses: string[];
    paymentStatuses: string[];
  }>({ orderStatuses: defaultOrderStatuses, paymentStatuses: defaultPaymentStatuses });
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const applyTodayData = useCallback((list: Order[], orderStatuses: string[], paymentStatuses: string[]) => {
    setOrders(list);
    setMeta({
      orderStatuses: orderStatuses.length ? orderStatuses : defaultOrderStatuses,
      paymentStatuses: paymentStatuses.length ? paymentStatuses : defaultPaymentStatuses,
    });
    setDrafts((prev) => {
      const next: Record<string, RowDraft> = {};
      for (const o of list) {
        next[o.id] = {
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          handledBy: o.handledBy ?? "",
        };
      }
      return next;
    });
  }, []);

  const reload = useCallback(async () => {
    const data = await getTodayDeliveries();
    applyTodayData(
      data.orders || [],
      data.availableOrderStatuses || [],
      data.availablePaymentStatuses || [],
    );
  }, [applyTodayData]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const data = await getTodayDeliveries();
        if (cancelled) return;
        applyTodayData(
          data.orders || [],
          data.availableOrderStatuses || [],
          data.availablePaymentStatuses || [],
        );
      } catch {
        if (!cancelled) setFetchError("Could not load today's schedule.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyTodayData]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const setDraft = (id: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const saveRow = async (orderId: string) => {
    const d = drafts[orderId];
    if (!d) return;
    await runAction(
      async () =>
        updateDeliveryOrderStatus(orderId, {
          orderStatus: d.orderStatus,
          paymentStatus: d.paymentStatus,
          ...(d.handledBy.trim() ? { handledBy: d.handledBy.trim() } : {}),
        }),
      "Order updated.",
    );
  };

  const formatDelivery = (o: Order) => {
    if (!o.deliveryDate) return "—";
    try {
      return new Date(o.deliveryDate).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return String(o.deliveryDate);
    }
  };

  const bannerError = fetchError || loadError;

  return (
    <section className="billing-card billing-history billing-today-schedule">
      {actionMessage && <p className="billing-success">{actionMessage}</p>}
      {bannerError && <p className="billing-error">{bannerError}</p>}
      {isLoading && <p className="billing-muted">Loading today&apos;s schedule…</p>}

      <p className="billing-history-hint billing-muted">Branch: {branchLabel}</p>

      <div className="history-cards">
        {orders.map((order) => {
          const d = drafts[order.id];
          const isOpen = expanded.has(order.id);
          const customer = order.customer;
          const name =
            [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim() || "—";

          return (
            <article key={order.id} className="history-card">
              <div className="history-card-head">
                <h3 className="history-card-orderId">{order.orderNumber}</h3>
                <time className="history-card-time" dateTime={order.deliveryDate || order.createdAt}>
                  {formatDelivery(order)}
                </time>
                <div className="history-card-head-end">
                  <div className="history-chip-wrap">
                    {d && (
                      <>
                        <span className={`history-chip ${orderStatusChipClass(d.orderStatus)}`}>{d.orderStatus}</span>
                        <span className={`history-chip ${paymentStatusChipClass(d.paymentStatus)}`}>
                          {d.paymentStatus}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className="history-card-expand"
                    onClick={() => toggleExpand(order.id)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Hide line items" : "Show line items"}
                  >
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
              </div>

              <div className="history-meta-inline">
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Customer</span>
                  <span className="history-meta-val">{name}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Phone</span>
                  <span className="history-meta-val">{customer?.customerPhone || "—"}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Branch</span>
                  <span className="history-meta-val">{order.branch?.branchName ?? branchLabel}</span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Total</span>
                  <span className="history-meta-val">
                    {currencyDisplayLabel("INR")} {toNumber(order.totalAmount).toFixed(2)}
                  </span>
                </span>
                <span className="history-meta-pair">
                  <span className="history-meta-lbl">Items</span>
                  <span className="history-meta-val">{order.items?.length ?? 0}</span>
                </span>
              </div>

              <div className="history-card-scheduleRow">
                {d && (
                  <>
                    <div className="history-card-field">
                      <span className="history-card-field-lbl">Order status</span>
                      <AppDropdown
                        className="appDropdown--inline"
                        variant="compact"
                        value={d.orderStatus}
                        onChange={(v) => setDraft(order.id, { orderStatus: v })}
                        disabled={isActing}
                        listTitle="Order status"
                        menuMinWidth={168}
                        options={meta.orderStatuses.map((value) => ({ value, label: value }))}
                      />
                    </div>
                    <div className="history-card-field">
                      <span className="history-card-field-lbl">Payment</span>
                      <AppDropdown
                        className="appDropdown--inline"
                        variant="compact"
                        value={d.paymentStatus}
                        onChange={(v) => setDraft(order.id, { paymentStatus: v })}
                        disabled={isActing}
                        listTitle="Payment"
                        menuMinWidth={168}
                        options={meta.paymentStatuses.map((value) => ({ value, label: value }))}
                      />
                    </div>
                    <div className="history-card-field history-card-field--grow">
                      <span className="history-card-field-lbl">Handled by</span>
                      <input
                        type="text"
                        className="history-schedule-input"
                        placeholder="User id or name"
                        value={d.handledBy}
                        onChange={(e) => setDraft(order.id, { handledBy: e.target.value })}
                        disabled={isActing}
                      />
                    </div>
                    <div className="history-card-field history-card-field--action">
                      <span className="history-card-field-lbl" aria-hidden>
                        &nbsp;
                      </span>
                      <button type="button" className="history-schedule-save" disabled={isActing} onClick={() => void saveRow(order.id)}>
                        Save
                      </button>
                    </div>
                  </>
                )}
              </div>

              {isOpen && (
                <>
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
                          <td>{item.product?.productName || "—"}</td>
                          <td>{item.service?.serviceName || "—"}</td>
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
                          <td colSpan={5}>No line items.</td>
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
                </>
              )}
            </article>
          );
        })}

        {!orders.length && !isLoading && (
          <p className="billing-muted">No deliveries scheduled for today.</p>
        )}
      </div>
    </section>
  );
}
