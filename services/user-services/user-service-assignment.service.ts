import api from "@/lib/api";

export type AssignmentLevel = "city" | "subcity" | "woreda";
export type OfficerType = "front_officer" | "back_officer";

export type UserServiceBoardParams = {
  level: AssignmentLevel;
  subcity_id?: number | string;
  woreda_id?: number | string;
};

export const userServiceAssignmentBoardService = {
  async board(params: UserServiceBoardParams) {
    const response = await api.get("/user-services/board", { params });
    return response.data.data;
  },

  async assign(payload: {
    service_id: number;
    officer_id: number;
    officer_type: OfficerType;
    window_id: number;
    level: AssignmentLevel;
    subcity_id?: number | string;
    woreda_id?: number | string;
  }) {
    const response = await api.post("/user-services/assign", payload);
    return response.data;
  },

  async unassign(payload: {
    service_id: number;
    officer_id: number;
    officer_type: OfficerType;
    window_id: number;
    level: AssignmentLevel;
    subcity_id?: number | string;
    woreda_id?: number | string;
  }) {
    const response = await api.delete("/user-services/unassign", {
      data: payload,
    });
    return response.data;
  },
};
