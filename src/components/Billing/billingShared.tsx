'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import type { Customer } from '@/services/api/customers';

export type BillingLine = {
  productId: string;
  serviceId: string;
  productName: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  availableServices: {
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    currency: string;
  }[];
};

export type CategoryOption = {
  id: string;
  categoryName: string;
  categoryCode: string;
};

export type CatalogProductCard = {
  productId: string;
  productName: string;
  categoryName: string;
  minPrice: number;
  currency: string;
};

export const toNumber = (value: string | number | null | undefined) => Number(value || 0);

export function userInitialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0];
    return w.slice(0, 2).toUpperCase();
  }
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

export const dateInputToISO8601 = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

export const localTodayYmd = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse `YYYY-MM-DD` as a local calendar date (no timezone shift). */
export const ymdToLocalDate = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Shift a `YYYY-MM-DD` string by integer days in local time. */
export const ymdAddDays = (ymd: string, deltaDays: number): string => {
  const dt = ymdToLocalDate(ymd);
  dt.setDate(dt.getDate() + deltaDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** e.g. Wed 20 May 2026 */
export const formatYmdLong = (ymd: string): string => {
  const dt = ymdToLocalDate(ymd);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const isDeliveryDateAllowed = (value: string): boolean => {
  if (!dateInputToISO8601(value)) return false;
  return value.trim() >= localTodayYmd();
};

export const BILLING_PHONE_DIGITS = 10;

export function billingPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, BILLING_PHONE_DIGITS);
}

export function billingPhoneMatchesStored(
  storedPhone: string | undefined,
  tenDigits: string
): boolean {
  if (tenDigits.length !== BILLING_PHONE_DIGITS) return false;
  const digits = (storedPhone || '').replace(/\D/g, '');
  const comparable =
    digits.length > BILLING_PHONE_DIGITS ? digits.slice(-BILLING_PHONE_DIGITS) : digits;
  return comparable === tenDigits;
}

export const formatOrderDate = (value: string | null | undefined): string => {
  if (value == null || value === '') return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const orderStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === 'DELIVERED') return 'history-chip--tone-success';
  if (u === 'CANCELLED') return 'history-chip--tone-danger';
  return 'history-chip--tone-info';
};

export const paymentStatusChipClass = (status: string): string => {
  const u = String(status).toUpperCase();
  if (u === 'PAID') return 'history-chip--tone-success';
  if (u === 'REFUNDED') return 'history-chip--tone-muted';
  if (u === 'PARTIAL') return 'history-chip--tone-warning';
  return 'history-chip--tone-warning';
};

export function BillingCustomerDetails({
  customer,
  variant = 'panel',
}: {
  customer: Customer | null;
  variant?: 'panel' | 'sidebar' | 'print';
}) {
  if (variant === 'print') {
    if (!customer) {
      return (
        <p>
          <span>Customer</span>
          <strong>-</strong>
        </p>
      );
    }
    const fullName =
      `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`.trim();
    const phone = customer.customerPhone?.trim();
    const email = customer.customerEmail?.trim();
    const address = customer.customerAddress?.trim();
    return (
      <>
        <p>
          <span>Customer</span>
          <strong>{fullName}</strong>
        </p>
        {phone ? (
          <p>
            <span>Phone</span>
            <strong>{phone}</strong>
          </p>
        ) : null}
        {email ? (
          <p>
            <span>Email</span>
            <strong>{email}</strong>
          </p>
        ) : null}
        {address ? (
          <p>
            <span>Address</span>
            <strong>{address}</strong>
          </p>
        ) : null}
      </>
    );
  }

  if (!customer) return null;

  const fullName =
    `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`.trim();
  const phone = customer.customerPhone?.trim();
  const email = customer.customerEmail?.trim();
  const address = customer.customerAddress?.trim();
  const hasContact = !!(phone || email || address);
  const sidebar = variant === 'sidebar';

  return (
    <div className={`billing-customerDetails${sidebar ? ' billing-customerDetails--sidebar' : ''}`}>
      {!sidebar ? <p className="billing-customerDetails-eyebrow">Customer</p> : null}
      <p className="billing-customerDetails-name">
        <strong>{fullName}</strong>
      </p>
      {hasContact ? (
        <dl className="billing-customerDetails-list">
          {phone ? (
            <div className="billing-customerDetails-item">
              <dt>Phone</dt>
              <dd>{phone}</dd>
            </div>
          ) : null}
          {email ? (
            <div className="billing-customerDetails-item">
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
          ) : null}
          {address ? (
            <div className="billing-customerDetails-item">
              <dt>Address</dt>
              <dd>{address}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  disabled = false,
  ariaLabel = 'Quantity',
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={['billing-qtyStepper', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="billing-qtyStepper-btn"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={14} strokeWidth={2} aria-hidden />
      </button>
      <span className="billing-qtyStepper-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="billing-qtyStepper-btn"
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export function CatalogCard({
  row,
  onAdd,
}: {
  row: CatalogProductCard;
  onAdd: (productId: string, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="catalog-item">
      <p className="title">{row.productName}</p>
      <p className="subtitle">{row.categoryName || '-'}</p>
      <p className="price">
        {currencyDisplayLabel(row.currency)} {toNumber(row.minPrice).toFixed(2)}
      </p>
      <div className="actions">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          ariaLabel={`Quantity for ${row.productName}`}
        />
        <button
          type="button"
          onClick={() => {
            onAdd(row.productId, quantity);
            setQuantity(1);
          }}
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>
    </article>
  );
}
