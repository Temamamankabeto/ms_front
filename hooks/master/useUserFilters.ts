"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * FORCE ARRAY ALWAYS (MOST IMPORTANT FIX)
 */
const toArray = (res: any): any[] => {
  const data = res?.data;

  if (Array.isArray(data)) return data; // case 1: direct array

  if (Array.isArray(data?.data)) return data.data; // case 2: paginated

  if (Array.isArray(data?.data?.data)) return data.data.data; // case 3: deep pagination

  return []; // fallback
};

/**
 * ======================
 * ROLES
 * ======================
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/admin/roles");
      return toArray(res);
    },
  });
};

/**
 * ======================
 * SUBCITIES
 * ======================
 */
export const useSubcities = () => {
  return useQuery({
    queryKey: ["subcities"],
    queryFn: async () => {
      const res = await api.get("/admin/subcities");
      return toArray(res);
    },
  });
};

/**
 * ======================
 * WOREDA
 * ======================
 */
export const useWoredas = () => {
  return useQuery({
    queryKey: ["woredas"],
    queryFn: async () => {
      const res = await api.get("/admin/woredas");
      return toArray(res);
    },
  });
};