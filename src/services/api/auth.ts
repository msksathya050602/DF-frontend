import apiClient from '@/services/api/client';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  roles: string[];
};

export type CurrentUserResponse = {
  status: number;
  message: string;
  id: string;
  userName: string;
  email: string;
  roles: string[];
};

export const basicAuthLogin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/login', { email, password });
  return response.data;
};

export const registerUser = async ({
  userName,
  email,
  password,
}: {
  userName: string;
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/users', { userName, email, password });
  return response.data;
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await apiClient.get<CurrentUserResponse>('/users/me');
  return response.data;
};
