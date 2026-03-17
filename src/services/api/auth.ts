import apiClient from "@/services/api/client";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  roles: string[];
};

export const basicAuthLogin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/login", { email, password });
  return response.data;
};
