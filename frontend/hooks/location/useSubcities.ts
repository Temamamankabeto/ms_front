"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getSubcities,
  createSubcity,
  updateSubcity,
  deleteSubcity,
} from "@/services/locations/service";

type SubcityPayload = {
  name: string;
  city_id: number;
};

type UpdateSubcityPayload = {
  id: number;
  data: SubcityPayload;
};

export const useSubcities = (page = 1) => {
  return useQuery({
    queryKey: ["subcities", page],
    queryFn: async () => {
      const res = await getSubcities(page);

      return {
        data: res?.data?.data || res?.data || [],
        meta: res?.data?.meta || null,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateSubcity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: SubcityPayload) =>
      createSubcity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcities"] });
    },
  });
};

export const useUpdateSubcity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateSubcityPayload) =>
      updateSubcity(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcities"] });
    },
  });
};

export const useDeleteSubcity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSubcity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcities"] });
    },
  });
};