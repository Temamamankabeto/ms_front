import { getToken } from "@/lib/api";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

export const mesobApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

mesobApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload) {
  const { data } = await mesobApi.post("/auth/login", payload);
  return data;
}

export async function getDashboard() {
  const { data } = await mesobApi.get("/admin/dashboard");
  return data;
}

export async function getMe() {
  const { data } = await mesobApi.get("/auth/me");
  return data;
}
