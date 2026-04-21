'use client';

import './orderHistory.scss';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import { ProgressIndicator } from '@library/ProgressIndicator';
import {
  getOrders,
  searchOrdersByPhone,
  type Order,
  type OrdersByPhoneCustomer,
  type OrdersByPhoneResponse,
} from '@/services/api/orders';

import { BillingPageShell } from '../BillingPageShell';
import { billingPhoneDigits, formatOrderDate, toNumber } from '../billingShared';
import { useBillingShell } from '../BillingShellContext';

type OrderHistoryCardProps = {
  order: Order;
  open: boolean;
  onToggle: () => void;
  branchFallback?: string;
};

function OrderHistoryCard({ order, open, onToggle, branchFallback }: OrderHistoryCardProps) {
  const customerLabel = `${order.customer?.firstName || '-'}${order.customer?.lastName ? ` ${order.customer.lastName}` : ''}`;
  const itemCount = order.items?.length ?? 0;

  return (
    <article className="history-card">
      <button
        type="button"
        className="history-card-summary"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={`history-card-chevron ${open ? 'is-open' : ''}`} aria-hidden />
        <span className="history-card-summary-inner">
          <span className="history-card-head">
            <span className="history-card-orderId">{order.orderNumber}</span>
            <time className="history-card-time" dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleString()}
            </time>
            <span className="history-chip-wrap">
              <span className="history-chip history-chip--plain">{order.orderStatus}</span>
              <span className="history-chip history-chip--plain">{order.paymentStatus}</span>
            </span>
          </span>
          {!open && (
            <span className="history-card-preview">
              {customerLabel}
              <span className="history-card-preview-sep">·</span>
              {itemCount} item{itemCount === 1 ? '' : 's'}
              <span className="history-card-preview-sep">·</span>
              {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="history-card-panel" id={`order-panel-${order.id}`}>
          <div className="history-meta-inline">
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Customer</span>
              <span className="history-meta-val">{customerLabel}</span>
            </span>
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Phone</span>
              <span className="history-meta-val">{order.customer?.customerPhone || '—'}</span>
            </span>
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Branch</span>
              <span className="history-meta-val">
                {order.branch?.branchName || branchFallback || '—'}
              </span>
            </span>
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Delivery date</span>
              <span className="history-meta-val">
                {formatOrderDate(order.deliveryDate ?? null)}
              </span>
            </span>
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Items</span>
              <span className="history-meta-val">{itemCount}</span>
            </span>
          </div>

          <div className="history-table-wrap">
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
                    <td>{item.product?.productName || '-'}</td>
                    <td>{item.service?.serviceName || '-'}</td>
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
                    <td colSpan={5}>No item rows available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
        </div>
      )}
    </article>
  );
}

function CustomerDetailCard({ customer }: { customer: OrdersByPhoneCustomer }) {
  const name = `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`.trim();
  return (
    <div className="billing-history-customerCard">
      <h3 className="billing-history-customerTitle">{name || 'Customer'}</h3>
      <dl className="billing-history-customerDl">
        <div>
          <dt>Phone</dt>
          <dd>{customer.customerPhone || '—'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{customer.customerEmail || '—'}</dd>
        </div>
        <div className="billing-history-customerDl--full">
          <dt>Address</dt>
          <dd>{customer.customerAddress || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OrderHistory() {
  const shell = useBillingShell();
  const { selectedBranchId, selectedBranch, userName, userEmail } = shell;
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [phoneSearchInput, setPhoneSearchInput] = useState('');
  const [phoneSearchResult, setPhoneSearchResult] = useState<OrdersByPhoneResponse | null>(null);
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [phoneSearchError, setPhoneSearchError] = useState('');

  const branchOrders = useMemo(
    () => orders.filter((order) => !selectedBranchId || order.branchId === selectedBranchId),
    [orders, selectedBranchId]
  );

  const displayedOrders = phoneSearchResult ? phoneSearchResult.orders : branchOrders;

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

  const toggleOrder = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runPhoneSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    const digits = billingPhoneDigits(phoneSearchInput);
    if (digits.length < 2) {
      setPhoneSearchError('Enter at least 2 digits.');
      return;
    }
    setPhoneSearchError('');
    setPhoneSearchLoading(true);
    try {
      const data = await searchOrdersByPhone(phoneSearchInput.trim());
      setPhoneSearchResult(data);
      setExpandedIds(new Set());
    } catch {
      setPhoneSearchError('Could not search orders. Try again.');
      setPhoneSearchResult(null);
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  const clearPhoneSearch = () => {
    setPhoneSearchInput('');
    setPhoneSearchResult(null);
    setPhoneSearchError('');
    setExpandedIds(new Set());
  };

  if (!shell.ready || !workspaceReady) return null;

  const subtitle = phoneSearchResult
    ? 'Customer and orders matching phone search (all branches).'
    : `Orders at ${selectedBranch?.branchName || 'the branch you selected'}.`;

  return (
    <BillingPageShell
      title="Order history"
      subtitle={subtitle}
      userName={userName || 'User'}
      userEmail={userEmail || ''}
    >
      <section className="billing-card billing-history billing-history--minimal">
        <form className="billing-history-search" onSubmit={(ev) => void runPhoneSearch(ev)}>
          <label htmlFor="order-history-phone-search" className="billing-history-searchLabel">
            Search by customer phone
          </label>
          <div className="billing-history-searchRow">
            <input
              id="order-history-phone-search"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Last digits or full number…"
              value={phoneSearchInput}
              disabled={phoneSearchLoading}
              onChange={(ev) => {
                setPhoneSearchInput(ev.target.value);
                if (phoneSearchError) setPhoneSearchError('');
              }}
            />
            <button
              type="submit"
              disabled={phoneSearchLoading}
              className="billing-history-searchSubmit"
            >
              {phoneSearchLoading ? (
                'Searching…'
              ) : (
                <>
                  <Search size={16} strokeWidth={2} aria-hidden />
                  Search
                </>
              )}
            </button>
            {phoneSearchResult ? (
              <button
                type="button"
                className="secondary billing-history-searchClear"
                onClick={clearPhoneSearch}
              >
                Clear search
              </button>
            ) : null}
          </div>
          {phoneSearchLoading ? (
            <div className="billing-history-searchProgress">
              <ProgressIndicator compact label="Searching orders…" />
            </div>
          ) : null}
          {phoneSearchError ? (
            <p className="billing-history-searchError billing-muted" role="alert">
              {phoneSearchError}
            </p>
          ) : null}
        </form>

        {!phoneSearchResult ? (
          <p className="billing-history-hint billing-muted">
            Branch: {selectedBranch?.branchName || '—'}
          </p>
        ) : (
          <p className="billing-history-hint billing-muted">
            Showing orders for matched customer(s); branch filter below does not apply to search
            results.
          </p>
        )}

        {phoneSearchResult && phoneSearchResult.customers.length > 0 ? (
          <div className="billing-history-customerPanel">
            <h2 className="billing-history-customerPanelTitle">Customer details</h2>
            <div className="billing-history-customerGrid">
              {phoneSearchResult.customers.map((c) => (
                <CustomerDetailCard key={c.id} customer={c} />
              ))}
            </div>
          </div>
        ) : null}

        {phoneSearchResult &&
        phoneSearchResult.customers.length === 0 &&
        phoneSearchResult.orders.length === 0 ? (
          <p className="billing-muted billing-history-noResults">
            No customer or orders found for that phone.
          </p>
        ) : null}

        <div className="history-listHeader">
          <span className="history-listHeader-chePad" aria-hidden />
          <span className="history-listHeader-main">Order</span>
          <div className="history-listHeader-right">
            <span className="history-listHeader-chipLbl">Order status</span>
            <span className="history-listHeader-chipLbl">Payment</span>
          </div>
        </div>
        <div className="history-cards">
          {displayedOrders.map((order) => (
            <OrderHistoryCard
              key={order.id}
              order={order}
              open={expandedIds.has(order.id)}
              onToggle={() => toggleOrder(order.id)}
              branchFallback={selectedBranch?.branchName}
            />
          ))}
          {!displayedOrders.length && (
            <p className="billing-muted">
              {phoneSearchResult
                ? 'No orders for this phone.'
                : 'No orders found for selected branch.'}
            </p>
          )}
        </div>
      </section>
    </BillingPageShell>
  );
}
