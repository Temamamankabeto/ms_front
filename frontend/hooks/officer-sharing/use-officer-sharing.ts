"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { officerSharingService } from "@/services/officer-sharing/officer-sharing.service";

export function useOfficerSharingWindows() {
  return useQuery({
    queryKey: ["officer-sharing-windows"],
    queryFn: officerSharingService.windows,
  });
}

export function useOfficerSharingOfficers(windowId?: number) {
  return useQuery({
    queryKey: ["officer-sharing-officers", windowId],
    queryFn: () => officerSharingService.officers(Number(windowId)),
    enabled: Boolean(windowId),
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
