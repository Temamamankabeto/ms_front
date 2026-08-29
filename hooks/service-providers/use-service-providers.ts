"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceProviderService } from "@/services/service-providers/service-provider.service";
import { ServiceProviderPayload } from "@/types/service-providers/service-provider";

const queryKey = (page: number, search: string) => [
  "service-providers",
  page,
  search,
];

export function useServiceProviders(page: number, search: string) {
  return useQuery({
    queryKey: queryKey(page, search),
    queryFn: () => serviceProviderService.list({ page, search, per_page: 15 }),
  });
}

export function useCreateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceProviderPayload) =>
      serviceProviderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
    },
  });
}

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ServiceProviderPayload }) =>
      serviceProviderService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
    },
  });
}

export function useDeleteServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviceProviderService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
    },
  });
}
