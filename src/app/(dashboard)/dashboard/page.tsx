'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ROUTES } from '@constants/routes';
import Link from 'next/link';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import type { Branch } from '@/services/api/branches';
import { getBranches } from '@/services/api/branches';
import { getPricing } from '@/services/api/catalog';
import { getCustomers } from '@/services/api/customers';
import type { Order } from '@/services/api/orders';
import { getOrders } from '@/services/api/orders';

import { toNumber } from './_lib/utils';

export default function DashboardOverviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [pricingCount, setPricingCount] = useState(0);

  const loadOverview = useCallback(async () => {
    try {
      setLoadError('');
      const [branchData, ordersData, customerData, pricingData] = await Promise.all([
        getBranches(),
        getOrders(),
        getCustomers(),
        getPricing(),
      ]);
      setBranches(branchData.branches || []);
      setOrders(ordersData.orders || []);
      setCustomerCount((customerData.customers || []).length);
      setPricingCount((pricingData.pricing || []).length);
    } catch {
      setLoadError('Failed to load overview data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const activeBranches = useMemo(() => branches.filter((b) => b.isActive), [branches]);

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  }, [orders]);

  const todaysRevenue = useMemo(
    () => todaysOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0),
    [todaysOrders]
  );

  const pendingOrders = useMemo(() => orders.filter((o) => o.orderStatus === 'CREATED'), [orders]);
  const paidOrders = useMemo(() => orders.filter((o) => o.paymentStatus === 'PAID'), [orders]);

  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.service?.id || item.serviceId;
        const name = item.service?.serviceName || 'Unknown service';
        const current = map.get(key);
        map.set(key, { name, qty: current ? current.qty + item.quantity : item.quantity });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.product?.id || item.productId;
        const name = item.product?.productName || 'Unknown product';
        const current = map.get(key);
        map.set(key, { name, qty: current ? current.qty + item.quantity : item.quantity });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [orders]
  );

  return (
    <>
      <section className="hero-stats">
        <article className="hero-card">
          <h3>Products</h3>
          <div className="hero-card-value">
            <span>◻</span>
            <p>{topProducts.length}</p>
          </div>
        </article>
        <article className="hero-card">
          <h3>Customers</h3>
          <div className="hero-card-value">
            <span>◉</span>
            <p>{customerCount}</p>
          </div>
        </article>
        <article className="hero-card">
          <h3>Orders</h3>
          <div className="hero-card-value">
            <span>⌘</span>
            <p>{orders.length}</p>
          </div>
        </article>
      </section>

      <section className="dashboard-stats">
        <article className="stat-card">
          <h3>Active Branches</h3>
          <p>{activeBranches.length}</p>
        </article>
        <article className="stat-card">
          <h3>Today Orders</h3>
          <p>{todaysOrders.length}</p>
        </article>
        <article className="stat-card">
          <h3>Today Revenue</h3>
          <p>
            {currencyDisplayLabel('INR')} {todaysRevenue.toFixed(2)}
          </p>
        </article>
        <article className="stat-card">
          <h3>Pending Orders</h3>
          <p>{pendingOrders.length}</p>
        </article>
        <article className="stat-card">
          <h3>Paid Orders</h3>
          <p>{paidOrders.length}</p>
        </article>
        <article className="stat-card">
          <h3>Pricing Rows</h3>
          <p>{pricingCount}</p>
        </article>
      </section>

      {loadError && (
        <section className="dashboard-card">
          <p className="error-text">{loadError}</p>
        </section>
      )}

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Branches</h2>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 14 }}>
            Create, edit, or remove branches.
          </p>
          <Link href={ROUTES.DASHBOARD_BRANCHES} className="dashboard-inline-link">
            Open Branches →
          </Link>
        </article>

        <article className="dashboard-card">
          <h2>Top Services</h2>
          <ul className="simple-list">
            {topServices.map((service) => (
              <li key={service.name}>
                <span>{service.name}</span>
                <strong>{service.qty}</strong>
              </li>
            ))}
            {!topServices.length && <li>No service usage yet.</li>}
          </ul>
        </article>

        <article className="dashboard-card">
          <h2>Top Products</h2>
          <ul className="simple-list">
            {topProducts.map((product) => (
              <li key={product.name}>
                <span>{product.name}</span>
                <strong>{product.qty}</strong>
              </li>
            ))}
            {!topProducts.length && <li>No product sales yet.</li>}
          </ul>
        </article>
      </section>

      <section className="dashboard-card">
        <h2>Recent Orders</h2>
        {isLoading && <p className="info-text">Loading…</p>}
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>{`${order.customer?.firstName || '-'}${order.customer?.lastName ? ` ${order.customer.lastName}` : ''}`}</td>
                <td>{order.branch?.branchName || '-'}</td>
                <td>{order.orderStatus}</td>
                <td>{order.paymentStatus}</td>
                <td>
                  {currencyDisplayLabel('INR')} {toNumber(order.totalAmount).toFixed(2)}
                </td>
              </tr>
            ))}
            {!recentOrders.length && !isLoading && (
              <tr>
                <td colSpan={7}>No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
