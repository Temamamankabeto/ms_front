"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  serviceFormService,
  serviceService,
} from "@/services/service/service";

import {
  AssignUserServicePayload,
  CreateServiceFormPayload,
  ServicePayload,
  UpdateServiceFormPayload,
} from "@/types/services/service";

const serviceApi: any = serviceService;
const assignmentApi: any = serviceService;

type CreateServiceFormFieldPayload = {
  service_form_id: number;
  section_id?: number | null;
  step_id?: number | null;
  label: string;
  name?: string;
  field_key?: string;
  type?: string;
  field_type?: string;
  placeholder?: string | null;
  help_text?: string | null;
  options?: unknown[] | null;
  validation_rules?: string | string[] | Record<string, unknown> | null;
  is_required?: boolean;
  required?: boolean;
  sort_order?: number;
  is_active?: boolean;
};

export function useServices(page = 1) {
  return useQuery({
    queryKey: ["services", page],
    queryFn: () => serviceService.getAll(page),
  });
}
export function useDropdownServices() {
  return useQuery({
    queryKey: ["services-dropdown"],
    queryFn: () => serviceService.getDropdownServices(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServicePayload) => serviceService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}


export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServicePayload> }) =>
      serviceService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useServiceOfficers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["service-officers", params],
    queryFn: () => assignmentApi.getOfficers?.(params) ?? [],
  });
}

export function useUserAssignedServices(userId?: number) {
  return useQuery({
    queryKey: ["user-services", userId],
    queryFn: () => assignmentApi.getByUser?.(userId!) ?? [],
    enabled: !!userId,
  });
}

export function useAssignUserServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AssignUserServicePayload }) =>
      assignmentApi.assign?.(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["service-officers"] });
      queryClient.invalidateQueries({ queryKey: ["user-services", variables.userId] });
    },
  });
}

export function useServiceForms(
  serviceId?: number,
  params?: { page?: number; search?: string; per_page?: number }
) {
  return useQuery({
    queryKey: ["service-forms", serviceId, params],
    queryFn: () => serviceFormService.getAll(serviceId!, params),
    enabled: !!serviceId,
  });
}

export function useServiceForm(id?: number) {
  return useQuery({
    queryKey: ["service-form", id],
    queryFn: () => serviceFormService.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateServiceForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: number; payload: CreateServiceFormPayload }) =>
      serviceFormService.create(serviceId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-forms"] }),
  });
}

export function useUpdateServiceForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateServiceFormPayload }) =>
      serviceFormService.update(id, payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["service-forms"] });
      queryClient.invalidateQueries({ queryKey: ["service-form", data?.data?.id] });
    },
  });
}

export function useDeleteServiceForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceFormService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-forms"] }),
  });
}

export function useToggleServiceForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceFormService.toggle(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["service-forms"] });
      queryClient.invalidateQueries({ queryKey: ["service-form", data?.data?.id] });
    },
  });
}

export function useServiceFormFieldMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: CreateServiceFormFieldPayload) =>
      serviceApi.createFormField?.(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-form-fields"] });
      queryClient.invalidateQueries({ queryKey: ["service-forms"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      serviceApi.updateFormField?.(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-form-fields"] });
      queryClient.invalidateQueries({ queryKey: ["service-forms"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => serviceApi.deleteFormField?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-form-fields"] });
      queryClient.invalidateQueries({ queryKey: ["service-forms"] });
    },
  });

  return { create, update, remove, delete: remove };
}