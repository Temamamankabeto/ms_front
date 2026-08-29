import api, { unwrap } from "@/lib/api";

export type CustomerApplicationsParams = {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
};

function queryString(params: CustomerApplicationsParams = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const text = query.toString();

  return text ? `?${text}` : "";
}

export const customerApplicationService = {
  async list(params: CustomerApplicationsParams = {}) {
    const response = await api.get(
      `/customer/service-applications${queryString(params)}`
    );

    return unwrap(response);
  },

  async details(id: number | string) {
    const response = await api.get(`/customer/service-applications/${id}`);
    return unwrap(response);
  },

  async resubmit(id: number | string, payload: FormData) {
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
