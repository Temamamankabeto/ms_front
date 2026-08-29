import api from "@/lib/api";
import {
  ServiceProviderListResponse,
  ServiceProviderPayload,
  ServiceProviderResponse,
} from "@/types/service-providers/service-provider";

export const serviceProviderService = {
  async list(params: { page?: number; search?: string; per_page?: number }) {
    const response = await api.get<ServiceProviderListResponse>(
      "/admin/service-providers",
      { params },
    );
    return response.data;
  },

  async create(payload: ServiceProviderPayload) {
    const response = await api.post<ServiceProviderResponse>(
      "/admin/service-providers",
      payload,
    );
    return response.data.data;
  },

  async update(id: number, payload: ServiceProviderPayload) {
    const response = await api.put<ServiceProviderResponse>(
      `/admin/service-providers/${id}`,
      payload,
    );
    return response.data.data;
  },

  async remove(id: number) {
    const response = await api.delete(`/admin/service-providers/${id}`);
    return response.data;
  },
};
