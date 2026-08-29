import api from "@/lib/api";

export type UserActivationRequest = {
  id: number;
  status: string;
  request_level?: string | null;
  request_note?: string | null;
  verification_note?: string | null;
  approval_note?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  verified_at?: string | null;
  approved_at?: string | null;
  user?: any;
  requester?: any;
  verifier?: any;
  approver?: any;
};

export type UserActivationRequestResponse = {
  success: boolean;
  message: string;
  data: UserActivationRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export const userActivationRequestService = {
  async list(params: { page?: number; search?: string; status?: string } = {}) {
    const response = await api.get<UserActivationRequestResponse>("/admin/user-activation-requests", {
      params: {
        page: params.page ?? 1,
        search: params.search || undefined,
        status: params.status || undefined,
        per_page: 10,
      },
    });

    return response.data;
  },

  async verify(id: number, note?: string) {
    const response = await api.post(`/admin/user-activation-requests/${id}/verify`, { note });
    return response.data;
  },

  async approve(id: number, note?: string) {
    const response = await api.post(`/admin/user-activation-requests/${id}/approve`, { note });
    return response.data;
  },

  async bulkApprove(ids: number[], note?: string) {
    const response = await api.post("/admin/user-activation-requests/bulk-approve", { ids, note });
    return response.data;
  },

  async reject(id: number, reason: string) {
    const response = await api.post(`/admin/user-activation-requests/${id}/reject`, { reason });
    return response.data;
  },
};
