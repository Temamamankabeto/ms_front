import api, { unwrap } from "@/lib/api";
import {
  ServiceCriterion,
  ServiceCriterionListResponse,
  ServiceCriterionPayload,
} from "@/types/service-criteria/service-criteria";

export const serviceCriterionService = {
  async list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    service_id?: number | string;
    status?: "all" | "active" | "inactive";
  }): Promise<ServiceCriterionListResponse> {
    const response = await api.get("/service-criteria", {
      params: {
        ...params,
        status: params?.status === "all" ? undefined : params?.status,
      },
    });

    return unwrap<ServiceCriterionListResponse>(response);
  },

  async create(payload: ServiceCriterionPayload): Promise<ServiceCriterion> {
    const response = await api.post("/service-criteria", payload);
    const body = unwrap<{ success: boolean; message: string; data: ServiceCriterion }>(response);

    return body.data;
  },

  async update(id: number, payload: Partial<ServiceCriterionPayload>): Promise<ServiceCriterion> {
    const response = await api.put(`/service-criteria/${id}`, payload);
    const body = unwrap<{ success: boolean; message: string; data: ServiceCriterion }>(response);

    return body.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/service-criteria/${id}`);
  },
};
