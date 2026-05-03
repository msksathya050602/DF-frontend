'use client';

import { useCallback, useEffect, useState } from 'react';
import AppDropdown from '@library/AppDropdown';
import { ProgressIndicator } from '@library/ProgressIndicator';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { toNumber } from '@/app/(dashboard)/dashboard/_lib/utils';
import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import { useAdminAction } from '@/hooks/useAdminAction';
import {
  getTodayDeliveries,
  updateDeliveryOrderStatus,
  type UpdateDeliveryOrderPayload,
} from '@/services/api/deliveries';
import type { Order } from '@/services/api/orders';

import { formatYmdLong, localTodayYmd, ymdAddDays } from '../Billing/billingShared';

type RowDraft = {
  orderStatus: string;
  paymentStatus: string;
  handledBy: string;
  /** Local input when payment is PARTIAL (INR). */
  amountPaidStr: string;
};

const defaultOrderStatuses = ['PENDING', 'DELIVERED', 'CANCELLED'];
const defaultPaymentStatuses = ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'];

const orderStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === 'DELIVERED') return 'history-chip--tone-success';
  if (u === 'CANCELLED') return 'history-chip--tone-danger';
  return 'history-chip--tone-info';
};

const paymentStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === 'PAID') return 'history-chip--tone-success';
  if (u === 'REFUNDED') return 'history-chip--tone-muted';
  if (u === 'PARTIAL') return 'history-chip--tone-warning';
  return 'history-chip--tone-warning';
};

export function TodayScheduleBilling({
  branchLabel,
  branchId,
  scheduleDateYmd,
  onScheduleDateYmdChange,
}: {
  branchLabel: string;
  branchId: string;
  scheduleDateYmd: string;
  onScheduleDateYmdChange: (ymd: string) => void;
}) {
  const [meta, setMeta] = useState<{
    orderStatuses: string[];
    paymentStatuses: string[];
  }>({ orderStatuses: defaultOrderStatuses, paymentStatuses: defaultPaymentStatuses });
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const applyTodayData = useCallback(
    (list: Order[], orderStatuses: string[], paymentStatuses: string[]) => {
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
            handledBy: o.handledBy ?? '',
            amountPaidStr:
              o.paymentStatus === 'PARTIAL' &&
              o.amountPaid !== undefined &&
              o.amountPaid !== null &&
              o.amountPaid !== ''
                ? String(toNumber(o.amountPaid))
                : '',
          };
        }
        return next;
      });
    },
    []
  );

  const reload = useCallback(async () => {
    if (!branchId.trim()) return;
    const data = await getTodayDeliveries(branchId.trim(), scheduleDateYmd);
    applyTodayData(
      data.orders || [],
      data.availableOrderStatuses || [],
      data.availablePaymentStatuses || []
    );
  }, [branchId, scheduleDateYmd, applyTodayData]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  useEffect(() => {
    if (!branchId.trim()) {
      setOrders([]);
      setIsLoading(false);
      setFetchError('');
      return;
    }
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const data = await getTodayDeliveries(branchId.trim(), scheduleDateYmd);
        if (cancelled) return;
        applyTodayData(
          data.orders || [],
          data.availableOrderStatuses || [],
          data.availablePaymentStatuses || []
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
  }, [branchId, scheduleDateYmd, applyTodayData]);

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
    const order = orders.find((o) => o.id === orderId);
    if (!d || !order) return;
    const total = toNumber(order.totalAmount);
    const payload: UpdateDeliveryOrderPayload = {
      orderStatus: d.orderStatus,
      paymentStatus: d.paymentStatus,
      ...(d.handledBy.trim() ? { handledBy: d.handledBy.trim() } : {}),
    };
    if (d.paymentStatus === 'PARTIAL') {
      const amt = Number(String(d.amountPaidStr).replace(/,/g, ''));
      if (!Number.isFinite(amt) || amt <= 0 || amt >= total) {
        window.alert(
          `Enter amount paid: greater than 0 and less than ${currencyDisplayLabel('INR')} ${total.toFixed(2)}`
        );
        return;
      }
      payload.amountPaid = amt;
    }
    await runAction(async () => updateDeliveryOrderStatus(orderId, payload), 'Order updated.');
  };

  const formatDelivery = (o: Order) => {
    if (!o.deliveryDate) return '—';
    try {
      return new Date(o.deliveryDate).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
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

      <div className="billing-schedule-toolbar">
        <div className="billing-schedule-dateNav" role="group" aria-label="Schedule date">
          <button
            type="button"
            className="billing-schedule-dateNav-arrow"
            aria-label="Previous day"
            disabled={isLoading}
            onClick={() => onScheduleDateYmdChange(ymdAddDays(scheduleDateYmd, -1))}
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden />
          </button>
          <label className="billing-schedule-dateNav-picker">
            <span className="billing-schedule-dateNav-display">
              {formatYmdLong(scheduleDateYmd)}
            </span>
            <input
              type="date"
              className="billing-schedule-dateNav-input"
              value={scheduleDateYmd}
              disabled={isLoading}
              onChange={(e) => {
                const v = e.target.value;
                if (v) onScheduleDateYmdChange(v);
              }}
              aria-label="Pick a date"
            />
          </label>
          <button
            type="button"
            className="billing-schedule-dateNav-arrow billing-schedule-dateNav-next"
            aria-label="Next day"
            disabled={isLoading}
            onClick={() => onScheduleDateYmdChange(ymdAddDays(scheduleDateYmd, 1))}
          >
            <ChevronRight size={20} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="billing-schedule-dateNav-today secondary"
            disabled={isLoading || scheduleDateYmd === localTodayYmd()}
            onClick={() => onScheduleDateYmdChange(localTodayYmd())}
          >
            Today
          </button>
        </div>

        <p className="billing-schedule-branchHint billing-muted">Branch: {branchLabel}</p>
      </div>

      <div className="history-listHeader history-listHeader--todaySchedule">
        <span className="history-listHeader-col">Order</span>
        <span className="history-listHeader-col">Scheduled</span>
        <div className="history-listHeader-right">
          <span className="history-listHeader-chipLbl">Order status</span>
          <span className="history-listHeader-chipLbl">Payment</span>
        </div>
        <span className="history-listHeader-expandPad" aria-hidden />
      </div>

      <div className="history-cards">
        {isLoading ? (
          <div className="billing-today-schedule-loader">
            <div className="billing-today-schedule-progressInner">
              <ProgressIndicator label="Loading schedule…" />
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const d = drafts[order.id];
            const isOpen = expanded.has(order.id);
            const customer = order.customer;
            const name =
              [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim() || '—';

            return (
              <article key={order.id} className="history-card">
                <div className="history-card-head">
                  <h3 className="history-card-orderId">{order.orderNumber}</h3>
                  <time
                    className="history-card-time"
                    dateTime={order.deliveryDate || order.createdAt}
                  >
                    {formatDelivery(order)}
                  </time>
                  <div className="history-card-head-end">
                    <div className="history-chip-wrap">
                      {d && (
                        <>
                          <span className={`history-chip ${orderStatusChipClass(d.orderStatus)}`}>
                            {d.orderStatus}
                          </span>
                          <span
                            className={`history-chip ${paymentStatusChipClass(d.paymentStatus)}`}
                          >
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
                      aria-label={isOpen ? 'Hide line items' : 'Show line items'}
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
                    <span className="history-meta-val">{customer?.customerPhone || '—'}</span>
                  </span>
                  <span className="history-meta-pair">
                    <span className="history-meta-lbl">Branch</span>
                    <span className="history-meta-val">
                      {order.branch?.branchName ?? branchLabel}
                    </span>
                  </span>
                  <span className="history-meta-pair">
                    <span className="history-meta-lbl">Total</span>
                    <span className="history-meta-val">
                      {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
                    </span>
                  </span>
                  <span className="history-meta-pair">
                    <span className="history-meta-lbl">Items</span>
                    <span className="history-meta-val">{order.items?.length ?? 0}</span>
                  </span>
                  {d?.paymentStatus === 'PARTIAL' &&
                    Number.isFinite(Number(d.amountPaidStr)) &&
                    Number(d.amountPaidStr) > 0 &&
                    Number(d.amountPaidStr) < toNumber(order.totalAmount) && (
                      <span className="history-meta-pair">
                        <span className="history-meta-lbl">Balance</span>
                        <span className="history-meta-val">
                          {currencyDisplayLabel('INR')}{' '}
                          {(toNumber(order.totalAmount) - Number(d.amountPaidStr)).toFixed(2)}
                        </span>
                      </span>
                    )}
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
                          onChange={(v) =>
                            setDraft(order.id, {
                              paymentStatus: v,
                              ...(v !== 'PARTIAL' ? { amountPaidStr: '' } : {}),
                            })
                          }
                          disabled={isActing}
                          listTitle="Payment"
                          menuMinWidth={168}
                          options={meta.paymentStatuses.map((value) => ({ value, label: value }))}
                        />
                      </div>
                      {d.paymentStatus === 'PARTIAL' && (
                        <div className="history-card-field">
                          <span className="history-card-field-lbl">Amount paid</span>
                          <input
                            type="number"
                            className="history-schedule-input"
                            min={0.01}
                            step={0.01}
                            placeholder="INR"
                            value={d.amountPaidStr}
                            onChange={(e) => setDraft(order.id, { amountPaidStr: e.target.value })}
                            disabled={isActing}
                          />
                        </div>
                      )}
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
                        <button
                          type="button"
                          className="history-schedule-save"
                          disabled={isActing}
                          onClick={() => void saveRow(order.id)}
                        >
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
                            <td>{item.product?.productName || '—'}</td>
                            <td>{item.service?.serviceName || '—'}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {currencyDisplayLabel('INR')} {toNumber(item.unitPrice).toFixed(2)}
                            </td>
                            <td>
                              {currencyDisplayLabel('INR')} {toNumber(item.lineTotal).toFixed(2)}
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
                          {currencyDisplayLabel('INR')} {toNumber(order.subTotal).toFixed(2)}
                        </strong>
                      </span>
                      <span className="history-total-pair">
                        <span className="history-total-lbl">Discount</span>
                        <strong className="history-total-amt">
                          {currencyDisplayLabel('INR')} {toNumber(order.discountAmount).toFixed(2)}
                        </strong>
                      </span>
                      <span className="history-total-pair">
                        <span className="history-total-lbl">Tax</span>
                        <strong className="history-total-amt">
                          {currencyDisplayLabel('INR')} {toNumber(order.taxAmount).toFixed(2)}
                        </strong>
                      </span>
                      <span className="history-total-pair history-total-pair--grand">
                        <span className="history-total-lbl">Total</span>
                        <strong className="history-total-amt">
                          {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </>
                )}
              </article>
            );
          })
        )}

        {!branchId.trim() && !isLoading && (
          <p className="billing-muted">
            Select a branch in the sidebar to see today&apos;s deliveries.
          </p>
        )}
        {!!branchId.trim() && !orders.length && !isLoading && (
          <p className="billing-muted">No deliveries scheduled for this date at this branch.</p>
        )}
      </div>

      {isActing && (
        <div
          className="billing-today-schedule-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="billing-today-schedule-progressInner">
            <ProgressIndicator label="Updating order…" />
          </div>
        </div>
      )}
    </section>
  );
}
