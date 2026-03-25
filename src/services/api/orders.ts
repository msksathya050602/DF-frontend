import apiClient from "@/services/api/client";

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
  orderStatus: string;
  paymentStatus: string;
  subTotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  createdAt: string;
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
};

export type UpdateOrderItemStatusPayload = {
  itemStatus: string;
};

export const getOrders = async (): Promise<OrdersResponse> => {
  const response = await apiClient.get<OrdersResponse>("/orders");
  return response.data;
};

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>("/orders", payload);
  return response.data;
};

export const updateOrderStatus = async (
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<{ order: Order }> => {
  const response = await apiClient.patch<{ order: Order }>(`/orders/${id}/status`, payload);
  return response.data;
};

export const updatePaymentStatus = async (
  id: string,
  payload: UpdatePaymentStatusPayload,
): Promise<{ order: Order }> => {
  const response = await apiClient.patch<{ order: Order }>(`/orders/${id}/payment-status`, payload);
  return response.data;
};

export const updateOrderItemStatus = async (
  id: string,
  payload: UpdateOrderItemStatusPayload,
): Promise<{ item: OrderItem }> => {
  const response = await apiClient.patch<{ item: OrderItem }>(`/order-items/${id}/status`, payload);
  return response.data;
};

export const cancelOrder = async (id: string): Promise<{ order: Order; message: string }> => {
  const response = await apiClient.delete<{ order: Order; message: string }>(`/orders/${id}`);
  return response.data;
};
