"use client";

import { useQuery } from "@tanstack/react-query";
import { reportingDashboardService, type ReportingDashboardParams } from "@/services/dashboard/reporting-dashboard.service";

export function useReportingDashboardCards() {
  return useQuery({ queryKey: ["reporting-dashboard-cards"], queryFn: () => reportingDashboardService.dashboard() });
}

export function useReportingDashboardReport(params: ReportingDashboardParams) {
  return useQuery({ queryKey: ["reporting-dashboard-report", params], queryFn: () => reportingDashboardService.report(params) });
}
