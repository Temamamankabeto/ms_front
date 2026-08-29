"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  UserServiceBoardParams,
  userServiceAssignmentBoardService,
} from "@/services/user-services/user-service-assignment.service";

export function useUserServiceAssignmentBoard(params: UserServiceBoardParams) {
  return useQuery({
    queryKey: ["user-service-assignment-board", params],
    queryFn: () => userServiceAssignmentBoardService.board(params),
  });
}

export function useAssignOfficerToService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: userServiceAssignmentBoardService.assign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-service-assignment-board"] });
    },
  });
}

export function useUnassignOfficerFromService() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: userServiceAssignmentBoardService.unassign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-service-assignment-board"] });
    },
  });
}
