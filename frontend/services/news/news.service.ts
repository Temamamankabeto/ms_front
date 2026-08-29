import api, { unwrap } from "@/lib/api";

export type NewsItem = {
  id: number;
  city_id?: number | null;
  title: string;
  description: string;
  status: "active" | "inactive";
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  city?: { id: number; name: string } | null;
  creator?: { id: number; name: string } | null;
};

type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

type SingleResponse<T> = { success: boolean; message: string; data: T };

export const newsService = {
  async publicList(params?: Record<string, unknown>) {
    return unwrap<PaginatedResponse<NewsItem>>(await api.get("/public/news", { params }));
  },
  async list(params?: Record<string, unknown>) {
    return unwrap<PaginatedResponse<NewsItem>>(await api.get("/admin/news", { params }));
  },
  async create(payload: Pick<NewsItem, "title" | "description" | "status">) {
    return unwrap<SingleResponse<NewsItem>>(await api.post("/admin/news", payload));
  },
  async update(id: number, payload: Partial<Pick<NewsItem, "title" | "description" | "status">>) {
    return unwrap<SingleResponse<NewsItem>>(await api.put(`/admin/news/${id}`, payload));
  },
  async remove(id: number) {
    return unwrap<SingleResponse<null>>(await api.delete(`/admin/news/${id}`));
  },
};
