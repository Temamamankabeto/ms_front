"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { windowService } from "@/services/window/window";

import {
  WindowPayload,
} from "@/types/windows/window";

export function useWindows(
  page = 1
) {
  return useQuery({
    queryKey: ["windows", page],

    queryFn: () =>
      windowService.getAll(page),
  });
}

export function useCreateWindow() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: WindowPayload
    ) =>
      windowService.create(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["windows"],
      });
    },
  });
}

export function useUpdateWindow() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<WindowPayload>;
    }) =>
      windowService.update(
        id,
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["windows"],
      });
    },
  });
}

export function useDeleteWindow() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      windowService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["windows"],
      });
    },
  });
}