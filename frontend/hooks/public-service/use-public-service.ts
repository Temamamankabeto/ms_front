"use client";

import { useQuery } from "@tanstack/react-query";

import {
  publicServiceService,
  LocationSelection,
} from "@/services/public-service/public-service";

export function usePublicLocations() {
  return useQuery({
    queryKey: ["public-locations"],
    queryFn: () => publicServiceService.locations(),
  });
}

export function usePublicServices(page = 1, search = "", selection: LocationSelection = {}) {
  return useQuery({
    queryKey: ["public-services", page, search, selection],
    queryFn: () => publicServiceService.getAll(page, search, selection),
    enabled: Boolean(selection.administrative_level),
  });
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: ["featured-public-services"],
    queryFn: () => publicServiceService.featured(),
  });
}

export function usePublicService(id: number) {
  return useQuery({
    queryKey: ["public-service", id],
    queryFn: () => publicServiceService.show(id),
    enabled: !!id,
  });
}

export function useWindowServices(selection: LocationSelection = {}) {
  return useQuery({
    queryKey: ["window-services", selection],
    queryFn: () => publicServiceService.windowServices(selection),
    enabled: Boolean(selection.administrative_level),
  });
}
