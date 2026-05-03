'use client';

import { useCallback, useEffect, useState } from 'react';
import AppDropdown from '@library/AppDropdown';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import type { Order } from '@/services/api/orders';
import {
  cancelOrder,
  getOrders,
  updateOrderItemStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from '@/services/api/orders';

import { AdminDeleteModal } from '../_lib/adminModals';
import { useAdminAction } from '../_lib/useAdminAction';
import { toNumber } from '../_lib/utils';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  /** Customer chose PARTIAL in the dropdown but has not applied an amount yet. */
  const [partialEntryOrderId, setPartialEntryOrderId] = useState<string | null>(null);
  const [partialAmountStr, setPartialAmountStr] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const data = await getOrders();
    setOrders(data.orders || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setPartialAmountStr((prev) => {
      const next = { ...prev };
      for (const o of orders) {
        if (o.paymentStatus === 'PARTIAL' && o.amountPaid != null && o.amountPaid !== '') {
          next[o.id] = String(toNumber(o.amountPaid));
        }
      }
      return next;
    });
  }, [orders]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const patchOrderStatus = async (orderId: string, orderStatus: string) => {
    await runAction(
      async () => updateOrderStatus(orderId, { orderStatus }),
      'Order status updated.'
    );
  };

  const paymentDropdownValue = (o: Order) =>
    partialEntryOrderId === o.id ? 'PARTIAL' : o.paymentStatus;

  const onPaymentChange = async (o: Order, v: string) => {
    if (v === 'PARTIAL') {
      setPartialEntryOrderId(o.id);
      setPartialAmountStr((p) => ({
        ...p,
        [o.id]:
          p[o.id] ??
          (o.amountPaid != null && o.amountPaid !== '' ? String(toNumber(o.amountPaid)) : ''),
      }));
      return;
    }
    if (partialEntryOrderId === o.id) setPartialEntryOrderId(null);
    await runAction(
      async () => updatePaymentStatus(o.id, { paymentStatus: v }),
      'Payment status updated.'
    );
  };

  const applyPartialPayment = async (o: Order) => {
    const amt = Number(String(partialAmountStr[o.id]).replace(/,/g, ''));
    const total = toNumber(o.totalAmount);
    if (!Number.isFinite(amt) || amt <= 0 || amt >= total) {
      window.alert(`Enter amount paid greater than 0 and less than ${total.toFixed(2)}.`);
      return;
    }
    await runAction(
      async () => updatePaymentStatus(o.id, { paymentStatus: 'PARTIAL', amountPaid: amt }),
      'Payment status updated.'
    );
    if (partialEntryOrderId === o.id) setPartialEntryOrderId(null);
  };

  const patchOrderItemStatus = async (itemId: string, itemStatus: string) => {
    await runAction(
      async () => updateOrderItemStatus(itemId, { itemStatus }),
      'Order item status updated.'
    );
  };

  const closeCancelModal = () => setCancelOrderId(null);

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    const id = cancelOrderId;
    closeCancelModal();
    await runAction(async () => cancelOrder(id), 'Order cancelled successfully.');
  };

  return (
    <>
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
                <td>{`${order.customer?.firstName || '-'}${order.customer?.lastName ? ` ${order.customer.lastName}` : ''}`}</td>
                <td>{order.branch?.branchName || '-'}</td>
                <td>
                  <AppDropdown
                    className="appDropdown--inline"
                    variant="compact"
                    value={order.orderStatus}
                    onChange={(v) => void patchOrderStatus(order.id, v)}
                    disabled={isActing}
                    listTitle="Order status"
                    menuMinWidth={168}
                    options={[
                      { value: 'CREATED', label: 'CREATED' },
                      { value: 'DELIVERED', label: 'DELIVERED' },
                      { value: 'CANCELLED', label: 'CANCELLED' },
                    ]}
                  />
                </td>
                <td>
                  <AppDropdown
                    className="appDropdown--inline"
                    variant="compact"
                    value={paymentDropdownValue(order)}
                    onChange={(v) => void onPaymentChange(order, v)}
                    disabled={isActing}
                    listTitle="Payment"
                    menuMinWidth={168}
                    options={[
                      { value: 'PENDING', label: 'PENDING' },
                      { value: 'PAID', label: 'PAID' },
                      { value: 'PARTIAL', label: 'PARTIAL' },
                      { value: 'REFUNDED', label: 'REFUNDED' },
                    ]}
                  />
                  {(order.paymentStatus === 'PARTIAL' || partialEntryOrderId === order.id) && (
                    <div className="dashboard-partial-payment">
                      <input
                        type="number"
                        className="dashboard-partial-payment-input"
                        min={0.01}
                        step={0.01}
                        placeholder="Amount paid"
                        value={partialAmountStr[order.id] ?? ''}
                        onChange={(e) =>
                          setPartialAmountStr((p) => ({ ...p, [order.id]: e.target.value }))
                        }
                        disabled={isActing}
                        aria-label="Partial amount paid"
                      />
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => void applyPartialPayment(order)}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
                </td>
                <td className="actions-cell">
                  <button
                    type="button"
                    onClick={() => setCancelOrderId(order.id)}
                    disabled={isActing}
                  >
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
          <h3 style={{ margin: '0 0 8px' }}>Order line items</h3>
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
                    <td>{item.product?.productName || '-'}</td>
                    <td>{item.service?.serviceName || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <AppDropdown
                        className="appDropdown--inline"
                        variant="compact"
                        value={item.itemStatus}
                        onChange={(v) => void patchOrderItemStatus(item.id, v)}
                        disabled={isActing}
                        listTitle="Item status"
                        menuMinWidth={168}
                        options={[
                          { value: 'RECEIVED', label: 'RECEIVED' },
                          { value: 'PROCESSING', label: 'PROCESSING' },
                          { value: 'DONE', label: 'DONE' },
                          { value: 'DELIVERED', label: 'DELIVERED' },
                        ]}
                      />
                    </td>
                  </tr>
                ))
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

      <AdminDeleteModal
        isOpen={!!cancelOrderId}
        title="Cancel this order?"
        description="This marks the order as cancelled. You can still view it in history depending on your workflow."
        confirmLabel="Cancel order"
        isActing={isActing}
        onClose={closeCancelModal}
        onConfirm={confirmCancelOrder}
      />
    </>
  );
}
