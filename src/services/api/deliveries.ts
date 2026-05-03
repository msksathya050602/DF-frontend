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
  /** Required when saving `PARTIAL` payment on delivery schedule. */
  amountPaid?: number;
  handledBy?: string;
};

export type UpdateDeliveryOrderResponse = {
  order: Order;
  message: string;
};

/** @param dateYmd Optional local calendar day `YYYY-MM-DD`; defaults to today on the server when omitted. */
export const getTodayDeliveries = async (
  branchId?: string,
  dateYmd?: string
): Promise<TodayDeliveriesResponse> => {
  const params: Record<string, string> = {};
  if (branchId?.trim()) params.branchId = branchId.trim();
  if (dateYmd?.trim()) params.date = dateYmd.trim();
  const response = await apiClient.get<TodayDeliveriesResponse>('/deliveries/today', {
    params: Object.keys(params).length ? params : undefined,
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
