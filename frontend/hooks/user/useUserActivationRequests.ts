"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userActivationRequestService } from "@/services/user/user-activation-request.service";

export function useUserActivationRequests(params: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: ["user-activation-requests", params],
    queryFn: () => userActivationRequestService.list(params),
  });
}

export function useVerifyActivationRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      userActivationRequestService.verify(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-activation-requests"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useApproveActivationRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      userActivationRequestService.approve(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-activation-requests"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkApproveActivationRequests() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, note }: { ids: number[]; note?: string }) =>
      userActivationRequestService.bulkApprove(ids, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-activation-requests"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRejectActivationRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      userActivationRequestService.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-activation-requests"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
