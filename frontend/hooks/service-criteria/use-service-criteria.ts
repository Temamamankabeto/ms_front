"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceCriterionService } from "@/services/service-criteria/service-criteria";
import { ServiceCriterionPayload } from "@/types/service-criteria/service-criteria";

export function useServiceCriteria(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  service_id?: number | string;
  status?: "all" | "active" | "inactive";
}) {
  return useQuery({
    queryKey: ["service-criteria", params],
    queryFn: () => serviceCriterionService.list(params),
  });
}

export function useCreateServiceCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceCriterionPayload) =>
      serviceCriterionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-criteria"] });
    },
  });
}

export function useUpdateServiceCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<ServiceCriterionPayload>;
    }) => serviceCriterionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-criteria"] });
    },
  });
}

export function useDeleteServiceCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceCriterionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-criteria"] });
    },
  });
}
