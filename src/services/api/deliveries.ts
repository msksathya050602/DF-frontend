import type { Order } from '@/services/api/orders';
import apiClient from '@/services/api/client';

export type TodayDeliveriesResponse = {
  orders: Order[];
  count: number;
  availableOrderStatuses: string[];
  availablePaymentStatuses: string[];
};

export type UpdateDeliveryOrderPayload = {
  orderStatus?: string;
  paymentStatus?: string;
  handledBy?: string;
};

export type UpdateDeliveryOrderResponse = {
  order: Order;
  message: string;
};

export const getTodayDeliveries = async (branchId?: string): Promise<TodayDeliveriesResponse> => {
  const response = await apiClient.get<TodayDeliveriesResponse>('/deliveries/today', {
    params: branchId ? { branchId } : undefined,
  });
  return response.data;
};

export const updateDeliveryOrderStatus = async (
  orderId: string,
  payload: UpdateDeliveryOrderPayload
): Promise<UpdateDeliveryOrderResponse> => {
  const response = await apiClient.patch<UpdateDeliveryOrderResponse>(
    `/deliveries/orders/${orderId}/status`,
    payload
  );
  return response.data;
};
