import apiClient from '@/services/api/client';

export type Category = {
  id: string;
  categoryName: string;
  categoryCode: string;
  isActive: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  productName: string;
  productCode: string;
  isActive: boolean;
  category?: Category;
};

export type Service = {
  id: string;
  serviceName: string;
  isActive: boolean;
};

export type Pricing = {
  id: string;
  productId: string;
  serviceId: string;
  price: string | number;
  currency: string;
  isActive: boolean;
  product?: Product;
  service?: Service;
};

export type PricingResponse = {
  pricing: Pricing[];
};

export type CategoriesResponse = {
  categories: Category[];
};

export type ProductsResponse = {
  products: Product[];
};

export type ServicesResponse = {
  services: Service[];
};

export type CreateCategoryPayload = {
  categoryName: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & { isActive?: boolean };

export type CreateProductPayload = {
  categoryId: string;
  productName: string;
};

export type UpdateProductPayload = Partial<CreateProductPayload> & { isActive?: boolean };

export type CreateServicePayload = {
  serviceName: string;
};

export type UpdateServicePayload = Partial<CreateServicePayload> & { isActive?: boolean };

export type CreatePricingPayload = {
  productId: string;
  serviceId: string;
  price: number;
  currency?: string;
};

export type UpdatePricingPayload = Partial<CreatePricingPayload> & { isActive?: boolean };

export const getPricing = async (): Promise<PricingResponse> => {
  const response = await apiClient.get<PricingResponse>('/pricing');
  return response.data;
};

export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await apiClient.get<CategoriesResponse>('/categories');
  return response.data;
};

export const createCategory = async (
  payload: CreateCategoryPayload
): Promise<{ category: Category }> => {
  const response = await apiClient.post<{ category: Category }>('/categories', payload);
  return response.data;
};

export const updateCategory = async (
  id: string,
  payload: UpdateCategoryPayload
): Promise<{ category: Category }> => {
  const response = await apiClient.put<{ category: Category }>(`/categories/${id}`, payload);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/categories/${id}`);
  return response.data;
};

export const getProducts = async (): Promise<ProductsResponse> => {
  const response = await apiClient.get<ProductsResponse>('/products');
  return response.data;
};

export const createProduct = async (
  payload: CreateProductPayload
): Promise<{ product: Product }> => {
  const response = await apiClient.post<{ product: Product }>('/products', payload);
  return response.data;
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload
): Promise<{ product: Product }> => {
  const response = await apiClient.put<{ product: Product }>(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/products/${id}`);
  return response.data;
};

export const getServices = async (): Promise<ServicesResponse> => {
  const response = await apiClient.get<ServicesResponse>('/services');
  return response.data;
};

export const createService = async (
  payload: CreateServicePayload
): Promise<{ service: Service }> => {
  const response = await apiClient.post<{ service: Service }>('/services', payload);
  return response.data;
};

export const updateService = async (
  id: string,
  payload: UpdateServicePayload
): Promise<{ service: Service }> => {
  const response = await apiClient.put<{ service: Service }>(`/services/${id}`, payload);
  return response.data;
};

export const deleteService = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/services/${id}`);
  return response.data;
};

export const createPricing = async (
  payload: CreatePricingPayload
): Promise<{ pricing: Pricing }> => {
  const response = await apiClient.post<{ pricing: Pricing }>('/pricing', payload);
  return response.data;
};

export const updatePricing = async (
  id: string,
  payload: UpdatePricingPayload
): Promise<{ pricing: Pricing }> => {
  const response = await apiClient.put<{ pricing: Pricing }>(`/pricing/${id}`, payload);
  return response.data;
};

export const deletePricing = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/pricing/${id}`);
  return response.data;
};
