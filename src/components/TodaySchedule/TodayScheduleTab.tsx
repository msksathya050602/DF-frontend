'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import AppDropdown from '@library/AppDropdown';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { toNumber } from '@/app/(dashboard)/dashboard/_lib/utils';
import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import { useAdminAction } from '@/hooks/useAdminAction';
import {
  getTodayDeliveries,
  updateDeliveryOrderStatus,
  type UpdateDeliveryOrderPayload,
} from '@/services/api/deliveries';
import type { Order } from '@/services/api/orders';

type RowDraft = {
  orderStatus: string;
  paymentStatus: string;
  handledBy: string;
  amountPaidStr: string;
};

const defaultOrderStatuses = ['PENDING', 'DELIVERED', 'CANCELLED'];
const defaultPaymentStatuses = ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'];

export function TodayScheduleTab() {
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
    const data = await getTodayDeliveries();
    applyTodayData(
      data.orders || [],
      data.availableOrderStatuses || [],
      data.availablePaymentStatuses || []
    );
  }, [applyTodayData]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setFetchError('');
      try {
        const data = await getTodayDeliveries();
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
        window.alert(`Enter a valid amount paid (0 < amount < ${total.toFixed(2)}).`);
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

  const tableError = fetchError || loadError;

  return (
    <div className="today-schedule">
      {actionMessage && <p className="today-schedule-info">{actionMessage}</p>}
      {tableError && <p className="today-schedule-error">{tableError}</p>}
      {isLoading && <p className="today-schedule-info">Loading today&apos;s schedule…</p>}

      <table className="today-schedule-table">
        <thead>
          <tr>
            <th className="today-schedule-col-expand" aria-hidden />
            <th>Order</th>
            <th>Customer</th>
            <th>Branch</th>
            <th>Delivery</th>
            <th>Order status</th>
            <th>Payment</th>
            <th>Handled by</th>
            <th>Note</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const d = drafts[order.id];
            const isOpen = expanded.has(order.id);
            const customer = order.customer;
            const name =
              [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim() || '—';

            return (
              <Fragment key={order.id}>
                <tr>
                  <td>
                    <button
                      type="button"
                      className="today-schedule-expand-btn"
                      onClick={() => toggleExpand(order.id)}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Hide products' : 'Show products'}
                    >
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                  <td>
                    <strong>{order.orderNumber}</strong>
                    <div className="today-schedule-meta">
                      {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <div className="today-schedule-customer">
                      <span className="today-schedule-customer-name">{name}</span>
                      {customer?.customerPhone && (
                        <span className="today-schedule-customer-line">
                          {customer.customerPhone}
                        </span>
                      )}
                      {customer?.customerEmail && (
                        <span className="today-schedule-customer-line">
                          {customer.customerEmail}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{order.branch?.branchName ?? '—'}</td>
                  <td>{formatDelivery(order)}</td>
                  <td>
                    {d && (
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
                    )}
                  </td>
                  <td>
                    {d && (
                      <div className="today-schedule-paymentCell">
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
                        {d.paymentStatus === 'PARTIAL' && (
                          <label className="today-schedule-partialLabel">
                            <span className="today-schedule-partialLbl">Paid</span>
                            <input
                              type="number"
                              className="schedule-field-input today-schedule-partialInput"
                              min={0.01}
                              step={0.01}
                              placeholder="Amount"
                              value={d.amountPaidStr}
                              onChange={(e) =>
                                setDraft(order.id, { amountPaidStr: e.target.value })
                              }
                              disabled={isActing}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="schedule-field-input"
                      placeholder="User UUID"
                      value={d?.handledBy ?? ''}
                      onChange={(e) => setDraft(order.id, { handledBy: e.target.value })}
                      disabled={isActing}
                    />
                  </td>
                  <td className="today-schedule-actions-cell">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => void saveRow(order.id)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="today-schedule-products-row">
                    <td colSpan={9}>
                      <div className="today-schedule-products">
                        <span className="today-schedule-products-title">
                          Products &amp; services
                        </span>
                        {(order.items?.length ?? 0) === 0 ? (
                          <p className="today-schedule-products-empty">No line items</p>
                        ) : (
                          <ul className="today-schedule-products-list">
                            {order.items!.map((item) => (
                              <li key={item.id}>
                                <span className="today-schedule-product-name">
                                  {item.product?.productName ?? 'Product'}
                                </span>
                                <span className="today-schedule-product-service">
                                  {item.service?.serviceName ?? '—'} × {item.quantity}
                                </span>
                                <span className="today-schedule-product-status">
                                  {item.itemStatus}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {!orders.length && !isLoading && (
            <tr>
              <td colSpan={9}>No deliveries scheduled for today.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
