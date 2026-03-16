import { isAxiosError } from "axios";

export function isAPIError(error: any): boolean {
  if (isAxiosError(error)) {
    if (error.response?.data?.error_message) {
      return true;
    }
    return false;
  }
  return false;
}
