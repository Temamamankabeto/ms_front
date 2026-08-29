"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "@/lib/api";

/**
 * =========================
 * TYPES
 * =========================
 */

export type UserFilters = {
  page?: number;
  per_page?: number;

  search?: string;

  status?: string;

  role?: string;

  city_id?: string | number;

  subcity_id?: string | number;

  woreda_id?: string | number;
};

/**
 * =========================
 * GET USERS
 * =========================
 */

export const useUsers = (
  filters: UserFilters
) => {
  const {
    page = 1,
    per_page = 10,

    search = "",

    status = "",

    role = "",

    city_id = "",

    subcity_id = "",

    woreda_id = "",
  } = filters;

  return useQuery({
    queryKey: [
      "users",

      page,
      per_page,

      search,

      status,

      role,

      city_id,

      subcity_id,

      woreda_id,
    ],

    queryFn: async () => {
      /*
      |--------------------------------------------------------------------------
      | CLEAN EMPTY FILTERS
      |--------------------------------------------------------------------------
      */

      const params = Object.fromEntries(
        Object.entries({
          page,
          per_page,

          search,

          status,

          role,

          city_id,

          subcity_id,

          woreda_id,
        }).filter(
          ([_, value]) =>
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "all"
        )
      );

      const res = await api.get(
        "/admin/users",
        {
          params,
        }
      );

      return (
        res?.data ?? {
          success: true,

          data: [],

          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
          },
        }
      );
    },

    placeholderData: (previousData) =>
      previousData,

    staleTime: 1000 * 60 * 5,
  });
};

/**
 * =========================
 * GET SINGLE USER
 * =========================
 */

export const useUser = (
  id?: number | string
) => {
  return useQuery({
    queryKey: ["user", id],

    queryFn: async () => {
      const res = await api.get(
        `/admin/users/${id}`
      );

      return res.data;
    },

    enabled: !!id,
  });
};

/**
 * =========================
 * CREATE USER
 * =========================
 */

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        "/admin/users",
        data
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};

/**
 * =========================
 * UPDATE USER
 * =========================
 */

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: any;
    }) => {
      const res = await api.put(
        `/admin/users/${id}`,
        data
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};

/**
 * =========================
 * DELETE USER
 * =========================
 */

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      id: number | string
    ) => {
      const res = await api.delete(
        `/admin/users/${id}`
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};

/**
 * =========================
 * TOGGLE STATUS
 * =========================
 */

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      id: number | string
    ) => {
      const res = await api.patch(
        `/admin/users/${id}/toggle-status`
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};