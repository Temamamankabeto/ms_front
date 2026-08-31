import api, { unwrap } from "@/lib/api";

export type CustomerApplicationsParams = {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
};

export type CustomerApplicationsResponse = {
  data: any[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    status_counts?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
};

function queryString(params: CustomerApplicationsParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }

    query.set(key, String(value));
  });

  const text = query.toString();

  return text ? `?${text}` : "";
}

function normalizeListResponse(response: any): CustomerApplicationsResponse {
  const payload = unwrap(response) as any;

  if (Array.isArray(payload)) {
    return { data: payload, meta: {} };
  }

  if (Array.isArray(payload?.data)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.data)) {
    return {
      ...payload.data,
      meta: payload.data.meta ?? payload.meta ?? {},
    };
  }

  return { data: [], meta: payload?.meta ?? payload?.data?.meta ?? {} };
}

export const customerApplicationService = {
  async list(params: CustomerApplicationsParams = {}): Promise<CustomerApplicationsResponse> {
    const response = await api.get(
      `/customer/service-applications${queryString(params)}`
    );

    return normalizeListResponse(response);
  },

  async details(id: number | string): Promise<any> {
    const response = await api.get(`/customer/service-applications/${id}`);
    const payload = unwrap(response) as any;

    return payload?.data ?? payload;
  },

  async resubmit(id: number | string, payload: FormData): Promise<any> {
    const response = await api.post(
      `/customer/service-applications/${id}/resubmit`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return unwrap(response);
  },
};
