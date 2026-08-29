"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  serviceFormService,
  serviceService,
} from "@/services/service/service";

export function useServiceForms() {
  return useQuery({
    queryKey: ["service-forms"],
queryFn: () => serviceFormService.getAll(1),
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => serviceService.getAll(),
  });
}

export function useCreateServiceForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      serviceFormService.create(
        data.serviceId ?? data.service_id,
        data.payload ?? data
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["service-forms"],
      });
    },
  });
}