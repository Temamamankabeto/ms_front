"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/services/permissions/service";

export const usePermissions = (
  page: number,
  perPage = 50,
  search = ""
) => {
  return useQuery({
    queryKey: ["permissions", page, perPage, search],
    queryFn: () => getPermissions(page, perPage, search),
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: any) => updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};