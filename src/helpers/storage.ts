export enum LocalStorage {
  USER_PREFERENCE_THEME = 'user-preference-theme',
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refreshToken',
  SELECTED_BRANCH_ID = 'selectedBranchId',
}

export enum SessionStorage {
  SESSION_Id = 'sessionId',
}

export type Storage = LocalStorage | SessionStorage;

export const getStorageKey = (key: Storage): string | null => {
  if (key in SessionStorage) {
    return sessionStorage.getItem(key) || null;
  }
  return localStorage.getItem(key) || null;
};

export const setStorageKey = (key: Storage, value: string): void => {
  if (key in SessionStorage) {
    sessionStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
};

export const removeStorageKey = (key: Storage): void => {
  if (key in SessionStorage) {
    sessionStorage.removeItem(key);
  } else {
    localStorage.removeItem(key);
  }
};

export const clearStorage = (key: 'localStorage' | 'sessionStorage'): void => {
  if (key === 'sessionStorage') {
    sessionStorage.clear();
  } else {
    localStorage.clear();
  }
};
