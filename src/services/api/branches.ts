import apiClient from "@/services/api/client";

export type Branch = {
  id: string;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BranchesResponse = {
  branches: Branch[];
};

export type CreateBranchPayload = {
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
};

export type CreateBranchResponse = {
  branch: Branch;
};

export const getBranches = async (): Promise<BranchesResponse> => {
  const response = await apiClient.get<BranchesResponse>("/branches");
  return response.data;
};

export const createBranch = async (payload: CreateBranchPayload): Promise<CreateBranchResponse> => {
  const response = await apiClient.post<CreateBranchResponse>("/branches", payload);
  return response.data;
};
