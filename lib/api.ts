import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://mesobbackend.adamacity.gov.et/api";

let accessToken: string | null = null;

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isBrowser() {
  return typeof window !== "undefined";
}

function ensureHeaders(config: InternalAxiosRequestConfig): AxiosHeaders {
  if (config.headers instanceof AxiosHeaders) {
    return config.headers;
  }

  config.headers = new AxiosHeaders(config.headers);
  return config.headers;
}

export function getToken() {
  return accessToken;
}

export function saveAccessToken(token: string | null) {
  accessToken = token;
}

export function saveSession(payload: { token?: string | null; access_token?: string | null }) {
  accessToken = payload.token ?? payload.access_token ?? null;
}

export function clearSession() {
  accessToken = null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken() {
  if (!isBrowser()) return null;

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((response) => {
        const token =
          response.data?.data?.access_token ??
          response.data?.access_token ??
          response.data?.token ??
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
  const headers = ensureHeaders(config);

  if (token && !headers.has("Authorization")) {
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
      !url.includes("/auth/login") &&
      !url.includes("/auth/register") &&
      !url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        const headers = ensureHeaders(originalRequest);
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
    }

    return Promise.reject(new Error(message));
  }
);

export function unwrap<T>(response: any): T {
  const body = response?.data;

  if (!body) {
    throw new Error("Invalid API response");
  }

  if (body.success === false) {
    throw new Error(body.message || "Request failed");
  }

  return body as T;
}

export default api;
