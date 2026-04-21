'use client';

import './analytics.scss';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import type { Branch } from '@/services/api/branches';
import { getBranches } from '@/services/api/branches';
import { getAnalyticsOverview, type AnalyticsOverviewResponse } from '@/services/api/analytics';

import { localTodayYmd, toNumber, ymdAddDays } from '../billingShared';

const defaultFromYmd = () => ymdAddDays(localTodayYmd(), -29);

export type AnalyticsViewProps = {
  /** Admin dashboard: branch filter in UI. Billing: metrics locked to sidebar branch. */
  variant: 'dashboard' | 'billing';
  /** When `variant` is billing, API is scoped to this branch */
  billingBranchId?: string;
  billingBranchName?: string;
};

export function AnalyticsView({
  variant,
  billingBranchId = '',
  billingBranchName = '',
}: AnalyticsViewProps) {
  const [fromYmd, setFromYmd] = useState(defaultFromYmd);
  const [toYmd, setToYmd] = useState(localTodayYmd);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const effectiveBranchId = variant === 'billing' ? billingBranchId.trim() : branchId.trim();

  useEffect(() => {
    if (variant !== 'dashboard') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getBranches();
        if (!cancelled) setBranches(res.branches || []);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const fetchAnalytics = useCallback(async () => {
    if (variant === 'billing' && !billingBranchId.trim()) {
      setData(null);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await getAnalyticsOverview({
        from: fromYmd,
        to: toYmd,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      });
      setData(response);
    } catch {
      setError('Could not load analytics.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [variant, fromYmd, toYmd, effectiveBranchId, billingBranchId, branchId]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const periodLabel = useMemo(() => {
    if (!data) return '';
    return `${data.period.from} → ${data.period.to}`;
  }, [data]);

  const statusEntries = (raw: Record<string, number>) =>
    Object.entries(raw).filter(([, n]) => n > 0);

  const filterCardClass =
    variant === 'billing' ? 'billing-card analytics-filters' : 'analytics-filters dashboard-card';

  const statCardWrapClass = variant === 'billing' ? 'billing-analytics-stats' : 'dashboard-stats';
  const innerCardClass = variant === 'billing' ? 'billing-card' : 'dashboard-card';

  if (variant === 'billing' && !billingBranchId.trim()) {
    return (
      <section className="billing-card">
        <p className="billing-muted">Select a branch in the sidebar to view analytics.</p>
      </section>
    );
  }

  return (
    <>
      <section className={filterCardClass}>
        <h2 className="analytics-filters-title">Filters</h2>
        <p className="analytics-filters-help">
          Metrics use <strong>order date</strong> (when the bill was created). Revenue excludes
          cancelled orders.
          {variant === 'billing' && billingBranchName ? (
            <>
              {' '}
              Showing data for <strong>{billingBranchName}</strong> only.
            </>
          ) : null}
        </p>
        <div className="analytics-filters-row">
          <label className="analytics-field">
            <span>From</span>
            <input
              type="date"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="analytics-field">
            <span>To</span>
            <input
              type="date"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
              disabled={loading}
            />
          </label>
          {variant === 'dashboard' ? (
            <label className="analytics-field analytics-field--grow">
              <span>Branch</span>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loading}
                aria-label="Filter by branch"
              >
                <option value="">All branches</option>
                {branches
                  .filter((b) => b.isActive)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className="analytics-apply"
            disabled={loading}
            onClick={() => void fetchAnalytics()}
          >
            Refresh
          </button>
        </div>
        {periodLabel ? <p className="analytics-period-label">{periodLabel}</p> : null}
      </section>

      {error ? (
        <section className={innerCardClass}>
          <p className="billing-error">{error}</p>
        </section>
      ) : null}

      {loading && !data ? <p className="billing-muted">Loading analytics…</p> : null}

      {data && (
        <>
          <section className={statCardWrapClass}>
            <article className="stat-card">
              <h3>Revenue (INR)</h3>
              <p>
                {toNumber(data.summary.revenueInr).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            </article>
            <article className="stat-card">
              <h3>Orders</h3>
              <p>{data.summary.orderCount}</p>
            </article>
            <article className="stat-card">
              <h3>Average order value</h3>
              <p>
                {currencyDisplayLabel('INR')}{' '}
                {toNumber(data.summary.averageOrderValueInr).toFixed(2)}
              </p>
            </article>
            <article className="stat-card">
              <h3>New customers</h3>
              <p>{data.summary.newCustomersCount}</p>
            </article>
            <article className="stat-card">
              <h3>Paid / pending pay</h3>
              <p>
                {data.summary.paidOrderCount} / {data.summary.pendingPaymentOrderCount}
              </p>
            </article>
            <article className="stat-card">
              <h3>Cancelled</h3>
              <p>{data.summary.cancelledOrderCount}</p>
            </article>
          </section>

          <section
            className={`dashboard-grid analytics-grid ${variant === 'billing' ? 'billing-analytics-grid' : ''}`}
          >
            <article className={innerCardClass}>
              <h2>Order status</h2>
              <ul className="simple-list">
                {statusEntries(data.orderStatusBreakdown).map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </li>
                ))}
              </ul>
            </article>
            <article className={innerCardClass}>
              <h2>Payment status</h2>
              <ul className="simple-list">
                {statusEntries(data.paymentStatusBreakdown).map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className={`${innerCardClass} analytics-section`}>
            <h2>Daily revenue</h2>
            <div className="analytics-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByDay.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.orderCount}</td>
                      <td>
                        {currencyDisplayLabel('INR')} {toNumber(row.revenueInr).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {!data.revenueByDay.length && (
                    <tr>
                      <td colSpan={3}>No orders in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className={`dashboard-grid analytics-grid ${variant === 'billing' ? 'billing-analytics-grid' : ''}`}
          >
            <article className={innerCardClass}>
              <h2>Top products (by line revenue)</h2>
              <ul className="simple-list">
                {data.topProducts.map((p) => (
                  <li key={p.id}>
                    <span>{p.name}</span>
                    <strong>
                      {currencyDisplayLabel('INR')} {toNumber(p.revenueInr).toFixed(2)} · qty{' '}
                      {p.quantity}
                    </strong>
                  </li>
                ))}
                {!data.topProducts.length && <li>No product lines in period.</li>}
              </ul>
            </article>
            <article className={innerCardClass}>
              <h2>Top services (by line revenue)</h2>
              <ul className="simple-list">
                {data.topServices.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <strong>
                      {currencyDisplayLabel('INR')} {toNumber(s.revenueInr).toFixed(2)} · qty{' '}
                      {s.quantity}
                    </strong>
                  </li>
                ))}
                {!data.topServices.length && <li>No service lines in period.</li>}
              </ul>
            </article>
          </section>

          {variant === 'dashboard' ? (
            <section className={`${innerCardClass} analytics-section`}>
              <h2>By branch</h2>
              <div className="analytics-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.branchBreakdown.map((b) => (
                      <tr key={b.branchId}>
                        <td>{b.branchName}</td>
                        <td>{b.orderCount}</td>
                        <td>
                          {currencyDisplayLabel('INR')} {toNumber(b.revenueInr).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!data.branchBreakdown.length && (
                      <tr>
                        <td colSpan={3}>No branch data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
