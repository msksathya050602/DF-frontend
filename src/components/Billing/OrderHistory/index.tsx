'use client';

import './orderHistory.scss';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import { ProgressIndicator } from '@library/ProgressIndicator';
import { searchCustomers, type Customer } from '@/services/api/customers';
import {
  getOrders,
  orderBalanceDue,
  searchOrders,
  type Order,
  type OrdersByPhoneCustomer,
  type OrdersByPhoneResponse,
} from '@/services/api/orders';

import { BillingPageShell } from '../BillingPageShell';
import { billingPhoneDigits, formatOrderDate, toNumber } from '../billingShared';
import { useBillingShell } from '../BillingShellContext';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function customerSuggestLabel(c: Customer): string {
  return `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`.trim();
}

type OrderHistoryNameSearchProps = {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  onSearchOrders: (query: string) => void | Promise<void>;
  errorMessage: string;
  onDismissError: () => void;
};

function OrderHistoryNameSearch({
  value,
  onChange,
  disabled,
  onSearchOrders,
  errorMessage,
  onDismissError,
}: OrderHistoryNameSearchProps) {
  const debounced = useDebounced(value.trim(), 300);
  const [listOpen, setListOpen] = useState(false);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['customers', 'nameSuggestions', debounced],
    queryFn: async () => {
      const res = await searchCustomers({ name: debounced, limit: 15 });
      return res.customers;
    },
    enabled: debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const showList = listOpen && debounced.length >= 2 && suggestions.length > 0 && !disabled;

  return (
    <form
      className="billing-history-search"
      onSubmit={(ev) => {
        ev.preventDefault();
        setListOpen(false);
        void onSearchOrders(value.trim());
      }}
    >
      <label htmlFor="order-history-name-search" className="billing-history-searchLabel">
        Search by customer name
      </label>
      <p className="billing-history-searchHint billing-muted">
        Type at least 2 letters, pick a suggestion, or press Search. Names are cached for faster
        repeats.
      </p>
      <div className="billing-history-searchRow billing-history-searchRow--withAutocomplete">
        <div className="billing-history-autocompleteWrap">
          <input
            id="order-history-name-search"
            type="text"
            autoComplete="off"
            placeholder="e.g. Sathya or Kumar…"
            value={value}
            disabled={disabled}
            onChange={(ev) => {
              onChange(ev.target.value);
              setListOpen(true);
              if (errorMessage) onDismissError();
            }}
            onFocus={() => setListOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setListOpen(false), 200);
            }}
            role="combobox"
            aria-expanded={showList}
            aria-controls="order-history-name-suggest-list"
            aria-autocomplete="list"
          />
          {isFetching && debounced.length >= 2 ? (
            <span className="billing-history-suggestLoading" aria-live="polite">
              …
            </span>
          ) : null}
          {showList ? (
            <ul
              id="order-history-name-suggest-list"
              className="billing-history-suggestList"
              role="listbox"
            >
              {suggestions.map((c) => (
                <li
                  key={c.id}
                  role="option"
                  className="billing-history-suggestItem"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const label = customerSuggestLabel(c);
                    onChange(label);
                    setListOpen(false);
                    void onSearchOrders(label);
                  }}
                >
                  <span className="billing-history-suggestName">{customerSuggestLabel(c)}</span>
                  {c.customerPhone ? (
                    <span className="billing-history-suggestMeta">{c.customerPhone}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button type="submit" disabled={disabled} className="billing-history-searchSubmit">
          {disabled ? (
            'Searching…'
          ) : (
            <>
              <Search size={16} strokeWidth={2} aria-hidden />
              Search
            </>
          )}
        </button>
      </div>
      {errorMessage ? (
        <p className="billing-history-searchError billing-muted" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

type OrderHistoryCardProps = {
  order: Order;
  open: boolean;
  onToggle: () => void;
  branchFallback?: string;
};

function formatHistoryDateTime(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function OrderHistoryCard({ order, open, onToggle, branchFallback }: OrderHistoryCardProps) {
  const customerLabel = `${order.customer?.firstName || '-'}${order.customer?.lastName ? ` ${order.customer.lastName}` : ''}`;
  const itemCount = order.items?.length ?? 0;
  const balanceDue = orderBalanceDue(order);
  const updatedIso = order.updatedAt ?? order.createdAt;
  const updatedMs = updatedIso ? new Date(updatedIso).getTime() : 0;
  const createdMs = order.createdAt ? new Date(order.createdAt).getTime() : 0;
  const showSeparateUpdated = Number.isFinite(updatedMs) && updatedMs !== createdMs;

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
            <span className="history-card-timeWrap">
              <time className="history-card-time" dateTime={order.createdAt}>
                Placed {formatHistoryDateTime(order.createdAt)}
              </time>
              {showSeparateUpdated && order.updatedAt ? (
                <time
                  className="history-card-time history-card-time--updated"
                  dateTime={order.updatedAt}
                >
                  · Updated {formatHistoryDateTime(order.updatedAt)}
                </time>
              ) : null}
            </span>
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
              {balanceDue > 0 ? (
                <>
                  <span className="history-card-preview-sep">·</span>
                  Balance {currencyDisplayLabel('INR')} {balanceDue.toFixed(2)}
                </>
              ) : null}
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
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Order placed</span>
              <span className="history-meta-val">{formatHistoryDateTime(order.createdAt)}</span>
            </span>
            <span className="history-meta-pair">
              <span className="history-meta-lbl">Last updated</span>
              <span className="history-meta-val">{formatHistoryDateTime(updatedIso)}</span>
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
            {order.paymentStatus === 'PARTIAL' &&
              order.amountPaid != null &&
              order.amountPaid !== '' && (
                <span className="history-total-pair">
                  <span className="history-total-lbl">Paid</span>
                  <strong className="history-total-amt">
                    {currencyDisplayLabel('INR')} {toNumber(order.amountPaid).toFixed(2)}
                  </strong>
                </span>
              )}
            {balanceDue > 0 && (
              <span className="history-total-pair">
                <span className="history-total-lbl">Balance</span>
                <strong className="history-total-amt">
                  {currencyDisplayLabel('INR')} {balanceDue.toFixed(2)}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CustomerDetailCard({ customer }: { customer: OrdersByPhoneCustomer }) {
  const name = `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`.trim();
  const outstanding = customer.outstandingBalance;
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
        {outstanding !== undefined && (
          <div>
            <dt>Balance due</dt>
            <dd>
              {currencyDisplayLabel('INR')} {Number(outstanding).toFixed(2)}
            </dd>
          </div>
        )}
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
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [remoteSearchResult, setRemoteSearchResult] = useState<OrdersByPhoneResponse | null>(null);
  const [remoteSearchKind, setRemoteSearchKind] = useState<'phone' | 'name' | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [phoneSearchError, setPhoneSearchError] = useState('');
  const [nameSearchError, setNameSearchError] = useState('');

  const branchOrders = useMemo(
    () => orders.filter((order) => !selectedBranchId || order.branchId === selectedBranchId),
    [orders, selectedBranchId]
  );

  const displayedOrders = remoteSearchResult ? remoteSearchResult.orders : branchOrders;

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
    setNameSearchError('');
    setSearchLoading(true);
    try {
      const data = await searchOrders({ phone: phoneSearchInput.trim() });
      setRemoteSearchResult(data);
      setRemoteSearchKind('phone');
      setExpandedIds(new Set());
    } catch {
      setPhoneSearchError('Could not search orders. Try again.');
      setRemoteSearchResult(null);
      setRemoteSearchKind(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const executeNameOrderSearch = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setNameSearchError('Enter at least 2 characters.');
      return;
    }
    setNameSearchError('');
    setPhoneSearchError('');
    setSearchLoading(true);
    try {
      const data = await searchOrders({ name: trimmed });
      setRemoteSearchResult(data);
      setRemoteSearchKind('name');
      setExpandedIds(new Set());
    } catch {
      setNameSearchError('Could not search orders. Try again.');
      setRemoteSearchResult(null);
      setRemoteSearchKind(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearRemoteSearch = () => {
    setPhoneSearchInput('');
    setNameSearchInput('');
    setRemoteSearchResult(null);
    setRemoteSearchKind(null);
    setPhoneSearchError('');
    setNameSearchError('');
    setExpandedIds(new Set());
  };

  if (!shell.ready || !workspaceReady) return null;

  const subtitle = remoteSearchResult
    ? remoteSearchKind === 'name'
      ? 'Customer and orders matching name search (all branches).'
      : 'Customer and orders matching phone search (all branches).'
    : `Orders at ${selectedBranch?.branchName || 'the branch you selected'}.`;

  return (
    <BillingPageShell
      title="Order history"
      subtitle={subtitle}
      userName={userName || 'User'}
      userEmail={userEmail || ''}
    >
      <section className="billing-card billing-history billing-history--minimal">
        <div className="billing-history-searchPair">
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
                disabled={searchLoading}
                onChange={(ev) => {
                  setPhoneSearchInput(ev.target.value);
                  if (phoneSearchError) setPhoneSearchError('');
                }}
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="billing-history-searchSubmit"
              >
                {searchLoading ? (
                  'Searching…'
                ) : (
                  <>
                    <Search size={16} strokeWidth={2} aria-hidden />
                    Search
                  </>
                )}
              </button>
            </div>
            {phoneSearchError ? (
              <p className="billing-history-searchError billing-muted" role="alert">
                {phoneSearchError}
              </p>
            ) : null}
          </form>

          <OrderHistoryNameSearch
            value={nameSearchInput}
            onChange={setNameSearchInput}
            disabled={searchLoading}
            onSearchOrders={(q) => void executeNameOrderSearch(q)}
            errorMessage={nameSearchError}
            onDismissError={() => setNameSearchError('')}
          />
        </div>

        {searchLoading ? (
          <div className="billing-history-searchProgress">
            <ProgressIndicator compact label="Searching orders…" />
          </div>
        ) : null}

        {remoteSearchResult ? (
          <button
            type="button"
            className="secondary billing-history-searchClear billing-history-searchClear--full"
            onClick={clearRemoteSearch}
          >
            Clear search
          </button>
        ) : null}

        {!remoteSearchResult ? (
          <p className="billing-history-hint billing-muted">
            Branch: {selectedBranch?.branchName || '—'}
          </p>
        ) : (
          <p className="billing-history-hint billing-muted">
            Showing orders for matched customer(s); branch filter below does not apply to search
            results.
          </p>
        )}

        {remoteSearchResult && remoteSearchResult.customers.length > 0 ? (
          <div className="billing-history-customerPanel">
            <h2 className="billing-history-customerPanelTitle">Customer details</h2>
            <div className="billing-history-customerGrid">
              {remoteSearchResult.customers.map((c) => (
                <CustomerDetailCard key={c.id} customer={c} />
              ))}
            </div>
          </div>
        ) : null}

        {remoteSearchResult &&
        remoteSearchResult.customers.length === 0 &&
        remoteSearchResult.orders.length === 0 ? (
          <p className="billing-muted billing-history-noResults">
            {remoteSearchKind === 'name'
              ? 'No customer or orders found for that name.'
              : 'No customer or orders found for that phone.'}
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
              {remoteSearchResult
                ? remoteSearchKind === 'name'
                  ? 'No orders for this name.'
                  : 'No orders for this phone.'
                : 'No orders found for selected branch.'}
            </p>
          )}
        </div>
      </section>
    </BillingPageShell>
  );
}
