"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

export type ServiceWindowLevel = "city" | "subcity" | "woreda";

export type ServiceWindowBoardParams = {
  level?: ServiceWindowLevel;
  subcity_id?: number | string;
  woreda_id?: number | string;
};

export type ServiceWindowBoardService = {
  id: number;
  name: string;
  description?: string | null;
  service_fee?: number;
  availability?: any;
  status?: string;
};

export type ServiceWindowBoardWindow = {
  id: number;
  name: string;
  availability?: any;
  services?: ServiceWindowBoardService[];
};

export type ServiceWindowBoard = {
  level?: ServiceWindowLevel;
  services: ServiceWindowBoardService[];
  unassigned_services?: ServiceWindowBoardService[];
  windows: ServiceWindowBoardWindow[];
};

function unwrap<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["service-window-board"] });
  queryClient.invalidateQueries({ queryKey: ["service-window-list"] });
  queryClient.invalidateQueries({ queryKey: ["service-windows"] });
  queryClient.invalidateQueries({ queryKey: ["services"] });
  queryClient.invalidateQueries({ queryKey: ["windows"] });
}

export function useServiceWindowBoard(params: ServiceWindowBoardParams = {}) {
  return useQuery<ServiceWindowBoard>({
    queryKey: ["service-window-board", params],
    queryFn: async () => {
      const response = await api.get("/service-window/board", { params });
      return unwrap<ServiceWindowBoard>(response);
    },
  });
}

export function useMoveServiceWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      service_id,
      serviceId,
      window_id,
      windowId,
      level,
      step_order = 1,
      is_required = true,
    }: {
      service_id?: number;
      serviceId?: number;
      window_id?: number;
      windowId?: number;
      level: ServiceWindowLevel;
      step_order?: number;
      is_required?: boolean;
    }) => {
      const response = await api.post("/service-window/move", {
        service_id: service_id ?? serviceId,
        window_id: window_id ?? windowId,
        level,
        step_order,
        is_required,
      });

      return unwrap(response);
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export const useMoveServiceToWindow = useMoveServiceWindow;

export function useRemoveServiceFromWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      service_id,
      serviceId,
      level,
    }: {
      service_id?: number;
      serviceId?: number;
      level: ServiceWindowLevel;
    }) => {
      const response = await api.delete(`/service-window/services/${service_id ?? serviceId}`, {
        params: { level },
      });

      return unwrap(response);
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export const useUnassignServiceWindow = useRemoveServiceFromWindow;
export const useUnassignServiceFromWindow = useRemoveServiceFromWindow;

export function useAssignServiceWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      service_id,
      windows,
    }: {
      serviceId?: number;
      service_id?: number;
      windows: Array<{
        window_id: number;
        step_order: number;
        is_required: boolean;
      }>;
    }) => {
      const response = await api.post(`/services/${serviceId ?? service_id}/windows`, { windows });
      return unwrap(response);
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export function useServiceWindows(serviceId?: number) {
  return useQuery({
    queryKey: ["service-windows", serviceId],
    queryFn: async () => {
      const response = await api.get(`/services/${serviceId}/windows`);
      return unwrap(response);
    },
    enabled: Boolean(serviceId),
  });
}
