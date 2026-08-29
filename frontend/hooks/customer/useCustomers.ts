// hooks/customer/useCustomers.ts

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { customerService } from "@/services/customer/customer.service";
import type { CustomerQueryParams } from "@/types/customer";

export const customerKeys = {
  all: ["customers"] as const,

  lists: () => [...customerKeys.all, "list"] as const,

  list: (params: CustomerQueryParams) =>
    [...customerKeys.lists(), params] as const,

  details: () => [...customerKeys.all, "detail"] as const,

  detail: (id: number | string) =>
    [...customerKeys.details(), id] as const,
};

export function useCustomers(params: CustomerQueryParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),

    queryFn: () => customerService.list(params),

    placeholderData: keepPreviousData,

    staleTime: 1000 * 60 * 5,

    retry: 1,
  });
}