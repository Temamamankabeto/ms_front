import api, { unwrap } from "@/lib/api";

import {
  AssignUserServicePayload,
  CreateServiceFormPayload,
  OfficerListResponse,
  PaginatedServiceResponse,
  Service,
  ServiceFormResponse,
  ServicePayload,
  SingleServiceFormResponse,
  UpdateServiceFormPayload,
  UserServiceAssignmentResponse,
} from "@/types/services/service";

export const serviceService = {
  async getAll(page = 1): Promise<PaginatedServiceResponse> {
    const response = await api.get(`/services?page=${page}`);
    return unwrap<PaginatedServiceResponse>(response);
  },
 async getDropdownServices() {
    const response = await api.get("/services-dropdown");
    return response.data;
  },
  async create(payload: ServicePayload): Promise<Service> {
    const response = await api.post("/services", payload);
    const data = unwrap<{ success: boolean; message: string; data: Service }>(response);
    return data.data;
  },

  async update(id: number, payload: Partial<ServicePayload>): Promise<Service> {
    const response = await api.put(`/services/${id}`, payload);
    const data = unwrap<{ success: boolean; message: string; data: Service }>(response);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/services/${id}`);
  },
};

export const userServiceAssignmentService = {
  async getOfficers(params?: {
    page?: number;
    search?: string;
    per_page?: number;
    level?: "city" | "subcity" | "woreda";
    subcity_id?: number | string;
    woreda_id?: number | string;
    role?: "front_officer" | "back_officer" | "";
  }): Promise<OfficerListResponse> {
    const response = await api.get("/service-officers", { params });
    return unwrap<OfficerListResponse>(response);
  },

  async assign(userId: number, payload: AssignUserServicePayload): Promise<UserServiceAssignmentResponse> {
    const response = await api.post(`/users/${userId}/services`, payload);
    return unwrap<UserServiceAssignmentResponse>(response);
  },

  async getByUser(userId: number): Promise<UserServiceAssignmentResponse> {
    const response = await api.get(`/users/${userId}/services`);
    return unwrap<UserServiceAssignmentResponse>(response);
  },
};

export const serviceFormService = {
  async getAll(
    serviceId: number,
    params?: { page?: number; search?: string; per_page?: number }
  ): Promise<ServiceFormResponse> {
    const response = await api.get(`/services/${serviceId}/forms`, { params });
    return unwrap<ServiceFormResponse>(response);
  },

  async getOne(id: number): Promise<SingleServiceFormResponse> {
    const response = await api.get(`/service-forms/${id}`);
    return unwrap<SingleServiceFormResponse>(response);
  },

  async create(serviceId: number, payload: CreateServiceFormPayload): Promise<SingleServiceFormResponse> {
    const response = await api.post(`/services/${serviceId}/forms`, payload);
    return unwrap<SingleServiceFormResponse>(response);
  },

  async update(id: number, payload: UpdateServiceFormPayload): Promise<SingleServiceFormResponse> {
    const response = await api.put(`/service-forms/${id}`, payload);
    return unwrap<SingleServiceFormResponse>(response);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/service-forms/${id}`);
  },

  async toggle(id: number): Promise<SingleServiceFormResponse> {
    const response = await api.patch(`/service-forms/${id}/toggle`);
    return unwrap<SingleServiceFormResponse>(response);
  },
};
