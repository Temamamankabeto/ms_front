"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  OfficerWindowBoardParams,
  officerWindowAssignmentService,
} from "@/services/officer-window-assignment/officer-window-assignment.service";

export function useOfficerWindowBoard(
    params: OfficerWindowBoardParams,
    options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["officer-window-assignment-board", params],
    queryFn: () => officerWindowAssignmentService.board(params),
    enabled: options?.enabled ?? true,
  });
}

export function useAssignOfficerToWindow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: officerWindowAssignmentService.assign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officer-window-assignment-board"] });
    },
  });
}

export function useUnassignOfficerFromWindow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: officerWindowAssignmentService.unassign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officer-window-assignment-board"] });
    },
  });
}