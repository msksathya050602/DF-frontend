import apiClient from '@/services/api/client';

import type { Order } from './orders';

export type Customer = {
  id: string;
  firstName: string;
  lastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  isActive: boolean;
};

export type CustomersResponse = {
  customers: Customer[];
};

export type CustomersSearchResponse = {
  customers: Customer[];
  count: number;
};

export type CustomerOrdersResponse = {
  customerId: string;
  orders: Order[];
  count: number;
};

export type CreateCustomerPayload = {
  firstName: string;
  lastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
};

export type CreateCustomerResponse = {
  customer: Customer;
};

export const getCustomers = async (): Promise<CustomersResponse> => {
  const response = await apiClient.get<CustomersResponse>('/customers');
  return response.data;
};

/** GET /customers/search — provide either `phone` or `name` (not both). Cached well with TanStack Query. */
export const searchCustomers = async (params: {
  phone?: string;
  name?: string;
  limit?: number;
}): Promise<CustomersSearchResponse> => {
  const response = await apiClient.get<CustomersSearchResponse>('/customers/search', {
    params: {
      ...(params.phone != null && String(params.phone).trim() !== ''
        ? { phone: params.phone }
        : {}),
      ...(params.name != null && String(params.name).trim() !== '' ? { name: params.name } : {}),
      ...(params.limit != null ? { limit: params.limit } : {}),
    },
  });
  return response.data;
};

/** GET /customers/search?phone=&limit= — `phone` may include formatting; only digits are used server-side. */
export const searchCustomersByPhone = async (
  phone: string,
  limit = 10
): Promise<CustomersSearchResponse> => {
  return searchCustomers({ phone, limit });
};

export const getCustomerOrders = async (customerId: string): Promise<CustomerOrdersResponse> => {
  const response = await apiClient.get<CustomerOrdersResponse>(`/customers/${customerId}/orders`);
  return response.data;
};

export const createCustomer = async (
  payload: CreateCustomerPayload
): Promise<CreateCustomerResponse> => {
  const response = await apiClient.post<CreateCustomerResponse>('/customers', payload);
  return response.data;
};
