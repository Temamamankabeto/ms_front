"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  customerApplicationService,
  type CustomerApplicationsParams,
} from "@/services/customer/customer-application.service";

export function useCustomerApplications(params: CustomerApplicationsParams = {}) {
  return useQuery({
    queryKey: ["customer-service-applications", params],
    queryFn: () => customerApplicationService.list(params),
    retry: 1,
  });
}

export function useCustomerApplication(id: number | string) {
  return useQuery({
    queryKey: ["customer-service-application", id],
    queryFn: () => customerApplicationService.details(id),
    enabled: Boolean(id),
    retry: 1,
  });
}

export function useResubmitCustomerApplication(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) =>
      customerApplicationService.resubmit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-service-applications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-service-application", id] });
    },
  });
}
