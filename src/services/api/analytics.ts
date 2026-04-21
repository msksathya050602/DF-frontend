import apiClient from '@/services/api/client';

export type AnalyticsOverviewResponse = {
  period: { from: string; to: string };
  branchId: string | null;
  summary: {
    orderCount: number;
    cancelledOrderCount: number;
    revenueInr: number;
    averageOrderValueInr: number;
    paidOrderCount: number;
    pendingPaymentOrderCount: number;
    newCustomersCount: number;
  };
  orderStatusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  revenueByDay: { date: string; orderCount: number; revenueInr: number }[];
  topProducts: { id: string; name: string; quantity: number; revenueInr: number }[];
  topServices: { id: string; name: string; quantity: number; revenueInr: number }[];
  branchBreakdown: {
    branchId: string;
    branchName: string;
    orderCount: number;
    revenueInr: number;
  }[];
};

export const getAnalyticsOverview = async (params?: {
  from?: string;
  to?: string;
  branchId?: string;
}): Promise<AnalyticsOverviewResponse> => {
  const search = new URLSearchParams();
  if (params?.from?.trim()) search.set('from', params.from.trim());
  if (params?.to?.trim()) search.set('to', params.to.trim());
  if (params?.branchId?.trim()) search.set('branchId', params.branchId.trim());
  const qs = search.toString();
  const response = await apiClient.get<AnalyticsOverviewResponse>(
    `/analytics/overview${qs ? `?${qs}` : ''}`
  );
  return response.data;
};
