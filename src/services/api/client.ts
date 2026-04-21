import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_SERVICE_URL } from '@/config';
import { getStorageKey, LocalStorage, removeStorageKey, setStorageKey } from '@/helpers/storage';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const getAccessToken = () => getStorageKey(LocalStorage.ACCESS_TOKEN);
const getRefreshToken = () => getStorageKey(LocalStorage.REFRESH_TOKEN);

const apiClient = axios.create({
  baseURL: API_SERVICE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_SERVICE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const statusCode = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isAuthRoute = requestUrl.includes('/login') || requestUrl.includes('/refresh');

    if (!originalRequest || statusCode !== 401 || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      removeStorageKey(LocalStorage.ACCESS_TOKEN);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await refreshClient.post<{
        accessToken: string;
        refreshToken: string;
      }>('/refresh', {
        refreshToken,
      });

      const newAccessToken = refreshResponse.data.accessToken;
      const newRefreshToken = refreshResponse.data.refreshToken;

      setStorageKey(LocalStorage.ACCESS_TOKEN, newAccessToken);
      if (newRefreshToken) {
        setStorageKey(LocalStorage.REFRESH_TOKEN, newRefreshToken);
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      removeStorageKey(LocalStorage.ACCESS_TOKEN);
      removeStorageKey(LocalStorage.REFRESH_TOKEN);
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
