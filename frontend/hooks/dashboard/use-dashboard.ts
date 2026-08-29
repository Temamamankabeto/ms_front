"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/services/dashboard/dashboard.service";

export function useDashboardOverview(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardService.getOverview,
    enabled: options.enabled ?? true,
    retry: 1,
  });
}
