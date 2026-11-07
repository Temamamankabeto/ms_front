import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const envBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const API_BASE_URL =
  envApiUrl ||
  (envBackendUrl ? `${envBackendUrl.replace(/\/$/, "")}/api` : "/api");

// Keep the access token for the lifetime of this browser tab, including reloads.
// sessionStorage is tab-scoped; it is cleared when the tab session ends.
const ACCESS_TOKEN_KEY = "mesob_access_token";
let accessToken: string | null = null;

function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // Storage can be blocked; in-memory auth still works for this page.
  }
}
let refreshPromise: Promise<string | null> | null = null;
let loginRedirectStarted = false;

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  __isRetryRequest?: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getToken() {
  // Rehydrate before the first authenticated request after a full page reload.
  if (!accessToken) accessToken = readStoredAccessToken();
  return accessToken;
}

export function getAccessToken() {
  return getToken();
}

export function saveAccessToken(token: string | null) {
  accessToken = token;
  persistAccessToken(token);
  if (token) loginRedirectStarted = false;
}

export function setAccessToken(token: string | null) {
  saveAccessToken(token);
}

export function saveSession(payload: { token?: string; access_token?: string } | null) {
  saveAccessToken(payload?.token ?? payload?.access_token ?? null);
}

export function clearSession() {
  accessToken = null;
  persistAccessToken(null);
}

export function unwrap<T = unknown>(response: AxiosResponse<T> | T): T {
  const value: any =
    response && typeof response === "object" && "data" in response
      ? (response as AxiosResponse<T>).data
      : response;

  if (value && typeof value === "object" && value.success === false) {
    throw new Error(value.message || "Request failed");
  }

  return value as T;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export async function refreshAccessToken() {
  if (!isBrowser()) return null;

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((response) => {
        const payload: any = response.data;
        const token =
          payload?.data?.access_token ||
          payload?.data?.token ||
          payload?.access_token ||
          payload?.token ||
          null;

        if (!token) return null;

        saveAccessToken(token);
        return token as string;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();

  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.__isRetryRequest &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register") &&
      !url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      originalRequest.__isRetryRequest = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        const headers =
          originalRequest.headers instanceof AxiosHeaders
            ? originalRequest.headers
            : new AxiosHeaders(originalRequest.headers);

        headers.set("Authorization", `Bearer ${newToken}`);
        originalRequest.headers = headers;

        return api(originalRequest);
      }
    }

    const data = error.response?.data;

    const message =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(", ") : null) ||
      error.message ||
      "Request failed";

    if (status === 401) {
      clearSession();

      if (isBrowser() && !window.location.pathname.includes("/login") && !loginRedirectStarted) {
        loginRedirectStarted = true;
        window.location.replace("/login");
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
