"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationService } from "@/services/application/application";

const service: any = applicationService;

export function useDashboardStats() {
  return useQuery({
    queryKey: ["application-dashboard-stats"],
    queryFn: async () =>
      service.dashboardStats?.() ?? {
        total: 0,
        pending: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
      },
  });
}

export const useApplicationDashboardStats = useDashboardStats;

export function useApplicationForm(serviceId: number) {
  return useQuery({
    queryKey: ["application-form", serviceId],
    queryFn: () => service.getForm(serviceId),
    enabled: Number.isFinite(serviceId) && serviceId > 0,
  });
}

export function useApplyService(serviceId: number) {
  return useMutation({
    mutationFn: ({ values, files = {}, selection }: any) =>
      service.apply(serviceId, values, files, selection),
  });
}

export const useApplyForService = useApplyService;

export function useTrackApplication() {
  return useMutation({
    mutationFn: (payload: any) => {
      const tracking =
        typeof payload === "string"
          ? payload
          : payload?.tracking_number ?? payload?.application_number ?? payload?.tracking;

      return service.track({ tracking_number: tracking });
    },
  });
}

export function useApplicationReview(id: number) {
  return useQuery({
    queryKey: ["application-review", id],
    queryFn: () => service.review?.(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: any) => service.approve?.(id, payload),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["application-review", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-dashboard-stats"] });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: any) => service.reject?.(id, payload),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["application-review", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-dashboard-stats"] });
    },
  });
}

export function useApplicationDetails(id: number) {
  return useQuery({
    queryKey: ["application-details", id],
    queryFn: () => service.details?.(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useOfficerQueue() {
  return useQuery({
    queryKey: ["officer-applications"],
    queryFn: () => service.officerQueue?.() ?? [],
  });
}

export function useOfficerAction(applicationId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, comment, payload = {} }: any) => {
      const finalId = id ?? applicationId;
      if (!finalId) throw new Error("Application ID is required.");

      return service.officerAction?.(finalId, action, {
        ...payload,
        comment,
        remark: comment,
      });
    },
    onSuccess: (_, variables: any) => {
      const finalId = variables.id ?? applicationId;
      queryClient.invalidateQueries({ queryKey: ["application-details", finalId] });
      queryClient.invalidateQueries({ queryKey: ["officer-applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-dashboard-stats"] });
    },
  });
}

export function useResubmitApplication(applicationId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const finalId = input instanceof FormData ? applicationId : input.id ?? applicationId;
      if (!finalId) throw new Error("Application ID is required.");

      if (input instanceof FormData) {
        return service.resubmit?.(finalId, input);
      }

      return service.resubmit?.(finalId, input.values ?? {}, input.files ?? {});
    },
    onSuccess: (_, variables: any) => {
      const finalId = variables instanceof FormData ? applicationId : variables.id ?? applicationId;
      queryClient.invalidateQueries({ queryKey: ["application-details", finalId] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });
}
