import apiClient from '@/services/api/client';

export type OrderItem = {
  id: string;
  productId: string;
  serviceId: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  itemStatus: string;
  product?: {
    id: string;
    productName: string;
    productCode: string;
    category?: {
      id: string;
      categoryName: string;
      categoryCode: string;
    };
  };
  service?: {
    id: string;
    serviceName: string;
    serviceCode: string;
  };
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  branchId: string;
  /** Staff user id (uuid) who last handled the order, when returned by API */
  handledBy?: string | null;
  orderStatus: string;
  paymentStatus: string;
  /** INR amount collected; set when PAID (full total) or PARTIAL (portion paid). */
  amountPaid?: string | number | null;
  subTotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  createdAt: string;
  /** Last modification time (status, payment, amounts, etc.). */
  updatedAt?: string;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  notes?: string | null;
  customer?: {
    id: string;
    firstName: string;
    lastName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  branch?: {
    id: string;
    branchName: string;
  };
  items?: OrderItem[];
};

export type OrdersResponse = {
  orders: Order[];
};

/** Mirrors `Customer` from `./customers` — kept local to avoid circular imports. */
export type OrdersByPhoneCustomer = {
  id: string;
  firstName: string;
  lastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  isActive?: boolean;
  /** Sum of unpaid balances on active non-cancelled orders from search results (INR). */
  outstandingBalance?: number;
};

export type OrdersByPhoneResponse = {
  customers: OrdersByPhoneCustomer[];
  orders: Order[];
};

export type CreateOrderPayload = {
  customerId: string;
  branchId: string;
  items: {
    productId: string;
    serviceId: string;
    quantity: number;
  }[];
  discountAmount?: number;
  taxAmount?: number;
  pickupDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
};

export type CreateOrderResponse = {
  order: Order;
};

export type UpdateOrderStatusPayload = {
  orderStatus: string;
};

export type UpdatePaymentStatusPayload = {
  paymentStatus: string;
  /** Required when `paymentStatus` is `PARTIAL`. */
  amountPaid?: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Remaining amount owed on the order (ignores cancelled orders). */
export function orderBalanceDue(order: Order): number {
  const total = round2(Number(order.totalAmount ?? 0));
  if (order.orderStatus === 'CANCELLED') return 0;
  switch (order.paymentStatus) {
    case 'PAID':
    case 'REFUNDED':
      return 0;
    case 'PENDING':
      return total;
    case 'PARTIAL': {
      const paid =
        order.amountPaid === undefined || order.amountPaid === null
          ? 0
          : round2(Number(order.amountPaid));
      return Math.max(0, round2(total - paid));
    }
    default:
      return total;
  }
}

export type UpdateOrderItemStatusPayload = {
  itemStatus: string;
};

export const getOrders = async (): Promise<OrdersResponse> => {
  const response = await apiClient.get<OrdersResponse>('/orders');
  return response.data;
};

export const searchOrders = async (params: {
  phone?: string;
  name?: string;
}): Promise<OrdersByPhoneResponse> => {
  const response = await apiClient.get<OrdersByPhoneResponse>('/orders/search', { params });
  return response.data;
};

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/orders', payload);
  return response.data;
};

export const updateOrderStatus = async (
  id: string,
  payload: UpdateOrderStatusPayload
): Promise<{ order: Order }> => {
  const response = await apiClient.patch<{ order: Order }>(`/orders/${id}/status`, payload);
  return response.data;
};

export const updatePaymentStatus = async (
  id: string,
  payload: UpdatePaymentStatusPayload
): Promise<{ order: Order }> => {
  const response = await apiClient.patch<{ order: Order }>(`/orders/${id}/payment-status`, payload);
  return response.data;
};

export const updateOrderItemStatus = async (
  id: string,
  payload: UpdateOrderItemStatusPayload
): Promise<{ item: OrderItem }> => {
  const response = await apiClient.patch<{ item: OrderItem }>(`/order-items/${id}/status`, payload);
  return response.data;
};

export const cancelOrder = async (id: string): Promise<{ order: Order; message: string }> => {
  const response = await apiClient.delete<{ order: Order; message: string }>(`/orders/${id}`);
  return response.data;
};
