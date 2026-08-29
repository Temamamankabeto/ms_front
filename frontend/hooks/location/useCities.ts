"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
} from "@/services/locations/service";

/* ================= TYPES ================= */

type CityPayload = {
  name: string;
  code?: string;
};

type UpdateCityPayload = {
  id: number;
  data: CityPayload;
};

/* ================= GET ALL CITIES ================= */

export const useCities = (page = 1) => {
  return useQuery({
    queryKey: ["cities", page],

    queryFn: async () => {
      const res = await getCities(page);

      console.log("Cities Response:", res);

      return {
        data:
          res?.data?.data ||
          res?.data ||
          [],

        meta:
          res?.data?.meta ||
          null,
      };
    },

    staleTime: 1000 * 60 * 5,
  });
};

/* ================= CREATE CITY ================= */

export const useCreateCity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CityPayload) =>
      createCity(data),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["cities"],
      });
    },
  });
};

/* ================= UPDATE CITY ================= */

export const useUpdateCity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: UpdateCityPayload) =>
      updateCity(id, data),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["cities"],
      });
    },
  });
};

/* ================= DELETE CITY ================= */

export const useDeleteCity = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteCity(id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["cities"],
      });
    },
  });
};