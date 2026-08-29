"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationWorkflowService } from "@/services/application-workflow/application-workflow";

type Id = string | number;
const workflow: any = applicationWorkflowService;

export function useApplicationSummary() {
  return useQuery({
    queryKey: ["application-summary"],
    queryFn: () =>
      workflow.dashboard?.summary?.() ??
      workflow.dashboard?.stats?.() ??
      workflow.dashboard?.index?.(),
  });
}

export function useApplication(id: Id) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => workflow.applications?.show?.(Number(id)),
    enabled: Boolean(id),
  });
}

export function useServiceApplication(id: Id) {
  return useApplication(id);
}

export function useServiceApplications(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["service-applications", params],
    queryFn: () => workflow.applications?.list?.(params),
  });
}

export function useOfficerApplicationQueue(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["officer-applications", params],
    queryFn: async () => {
      const response = await workflow.officer?.queue?.(params);
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    },
  });
}

export function useOfficerApplication(id: Id) {
  return useQuery({
    queryKey: ["officer-application", id],
    queryFn: () => workflow.officer?.show?.(Number(id)),
    enabled: Boolean(id),
  });
}

export function useManagerApplicationQueue(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["manager-applications", params],
    queryFn: () => workflow.manager?.queue?.(params),
  });
}

export function useManagerApplication(id: Id) {
  return useApplication(id);
}

export function useOfficerApplicationAction(_id?: Id) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) =>
      workflow.officer?.action?.({
        id: payload?.id ?? _id,
        ...payload,
      }),
    onSuccess: (_data, variables: any) => {
      qc.invalidateQueries({ queryKey: ["officer-applications"] });
      qc.invalidateQueries({ queryKey: ["officer-application", variables?.id ?? _id] });
      qc.invalidateQueries();
    },
  });
}

export function useBackOfficerApplicationAction(_id?: Id) {
  return useOfficerApplicationAction(_id);
}

export function useManagerApplicationAction(_id?: Id) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) =>
      workflow.manager?.action?.(payload) ??
      workflow.manager?.update?.(payload),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useOfficerSharingWindows(
  paramsOrEnabled?: Record<string, any> | boolean
) {
  const enabled = typeof paramsOrEnabled === "boolean" ? paramsOrEnabled : true;
  const params = typeof paramsOrEnabled === "boolean" ? undefined : paramsOrEnabled;

  return useQuery({
    queryKey: ["officer-sharing-windows", params],
    queryFn: () =>
      workflow.sharing?.windows?.(params) ??
      workflow.officer?.sharingWindows?.(params),
    enabled,
  });
}

export function useOfficerSharingOfficers(windowId?: Id, enabled = true) {
  return useQuery({
    queryKey: ["officer-sharing-officers", windowId],
    queryFn: () =>
      workflow.sharing?.officers?.(windowId) ??
      workflow.officer?.sharingOfficers?.(windowId),
    enabled: Boolean(windowId) && enabled,
  });
}

export function useServiceFormBuilder(id: Id) {
  return useQuery({
    queryKey: ["service-form-builder", id],
    queryFn: () =>
      workflow.builder?.show?.(Number(id)) ??
      workflow.forms?.show?.(Number(id)),
    enabled: Boolean(id),
  });
}

export function useCreateServiceFormStep(serviceFormId?: Id) {
  return useMutation({
    mutationFn: (payload: any) =>
      workflow.steps?.create?.({ service_form_id: serviceFormId, ...payload }),
  });
}

export function useCreateServiceFormSection(serviceFormId?: Id) {
  return useMutation({
    mutationFn: (payload: any) =>
      workflow.sections?.create?.({ service_form_id: serviceFormId, ...payload }),
  });
}

export function useCreateServiceFormField(serviceFormId?: Id) {
  return useMutation({
    mutationFn: (payload: any) =>
      workflow.fields?.create?.({ service_form_id: serviceFormId, ...payload }),
  });
}

export function useUpdateServiceFormField(_serviceFormId?: Id) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: Id; payload: Record<string, unknown> }) =>
      workflow.fields?.update?.(Number(id), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-form-builder", _serviceFormId] });
      qc.invalidateQueries({ queryKey: ["service-form-fields"] });
      qc.invalidateQueries({ queryKey: ["service-forms"] });
    },
  });
}

export function useDeleteServiceFormField(_serviceFormId?: Id) {
  return useMutation({
    mutationFn: (id: Id) => workflow.fields?.remove?.(Number(id)),
  });
}

export function useCreateServiceFormCondition(serviceFormId?: Id) {
  return useMutation({
    mutationFn: (payload: any) =>
      workflow.conditions?.create?.({ service_form_id: serviceFormId, ...payload }),
  });
}

export function useDeleteServiceFormCondition(_serviceFormId?: Id) {
  return useMutation({
    mutationFn: (id: Id) => workflow.conditions?.remove?.(Number(id)),
  });
}
export function useApplicationDashboardStats() {
  return useQuery({
    queryKey: ["application-dashboard-stats"],
    queryFn: async () => ({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    }),
  });
}