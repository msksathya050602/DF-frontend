import apiClient from "@/services/api/client";

import type { Order } from "./orders";

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
  const response = await apiClient.get<CustomersResponse>("/customers");
  return response.data;
};

export const getCustomerOrders = async (customerId: string): Promise<CustomerOrdersResponse> => {
  const response = await apiClient.get<CustomerOrdersResponse>(`/customers/${customerId}/orders`);
  return response.data;
};

export const createCustomer = async (payload: CreateCustomerPayload): Promise<CreateCustomerResponse> => {
  const response = await apiClient.post<CreateCustomerResponse>("/customers", payload);
  return response.data;
};
