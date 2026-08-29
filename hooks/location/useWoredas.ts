"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getWoredas,
  createWoreda,
  updateWoreda,
  deleteWoreda,
} from "@/services/locations/service";

import api from "@/lib/api";

type WoredaPayload = {
  name: string;
  subcity_id: number;
};

type UpdateWoredaPayload = {
  id: number;
  data: WoredaPayload;
};

export const useWoredas = (page = 1) => {
  return useQuery({
    queryKey: ["woredas", page],

    queryFn: async () => {
      const res = await getWoredas(page);

      return {
        data: res?.data?.data || res?.data || [],
        meta: res?.data?.meta || null,
      };
    },

    staleTime: 1000 * 60 * 5,
  });
};

export const useWoredasWithSubcity = (
  subcityId?: string
) => {
  return useQuery({
    queryKey: ["woredas", "subcity", subcityId],

    queryFn: async () => {
      if (!subcityId) return [];

      const res = await api.get("/admin/woredas", {
        params: { subcity_id: subcityId },
      });

      return Array.isArray(res?.data)
        ? res.data
        : res?.data?.data ?? [];
    },

    enabled: !!subcityId,
  });
};

export const useCreateWoreda = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: WoredaPayload) =>
      createWoreda(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
};

export const useUpdateWoreda = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateWoredaPayload) =>
      updateWoreda(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
};

export const useDeleteWoreda = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteWoreda(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["woredas"] });
    },
  });
};