"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { officerSharingService } from "@/services/officer-sharing/officer-sharing.service";

export function useOfficerSharingWindows(params?: { service_id?: number; level?: string } | false) {
  return useQuery({
    queryKey: ["officer-sharing-windows", params],
    queryFn: () => officerSharingService.windows(params || undefined),
    enabled: params !== false,
  });
}

export function useOfficerSharingOfficers(windowId?: number, enabled = true) {
  return useQuery({
    queryKey: ["officer-sharing-officers", windowId],
    queryFn: () => officerSharingService.officers(Number(windowId)),
    enabled: enabled && Boolean(windowId),
  });
}

export function useShareApplicationToOfficer(applicationId: number) {
  return useMutation({
    mutationFn: (payload: {
      to_window_id: number;
      to_officer_id: number;
      note?: string;
    }) => officerSharingService.share(applicationId, payload),
  });
}
