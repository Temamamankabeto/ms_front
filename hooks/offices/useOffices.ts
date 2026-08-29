"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOffices,
  createOffice,
  updateOffice,
  deleteOffice,
} from "@/services/offices/service"

// LIST
export const useOffices = () => {
  return useQuery({
    queryKey: ["offices"],
    queryFn: getOffices,
  });
};

// CREATE
export const useCreateOffice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
  });
};

// UPDATE
export const useUpdateOffice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      updateOffice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
  });
};

// DELETE
export const useDeleteOffice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
  });
};