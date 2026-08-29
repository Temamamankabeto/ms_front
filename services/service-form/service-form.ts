import api from "@/lib/api";

import {
  ServiceForm,
  ServiceFormPayload,
} from "@/types/service-form/service-form";

function listFromResponse(response: any): ServiceForm[] {
  const value = response.data?.data;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;

  return [];
}

export const ServiceFormAPI = {
  list: async (): Promise<ServiceForm[]> => {
    const response = await api.get("/admin/service-forms");

    return listFromResponse(response);
  },

  show: async (id: number): Promise<ServiceForm> => {
    const response = await api.get(`/admin/service-forms/${id}`);

    return response.data.data;
  },

  create: async (payload: ServiceFormPayload): Promise<ServiceForm> => {
    const response = await api.post("/admin/service-forms", payload);

    return response.data.data;
  },

  update: async (id: number, payload: ServiceFormPayload): Promise<ServiceForm> => {
    const response = await api.put(`/admin/service-forms/${id}`, payload);

    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/service-forms/${id}`);
  },
};
