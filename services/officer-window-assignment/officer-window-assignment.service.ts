import api from "@/lib/api";

export type OfficerWindowLevel = "city" | "subcity" | "woreda";

export type OfficerWindowBoardParams = {
  level: OfficerWindowLevel;
  subcity_id?: number | string;
  woreda_id?: number | string;
};

export const officerWindowAssignmentService = {
  async board(params: OfficerWindowBoardParams) {
    const response = await api.get("/officer-window-assignment/board", { params });
    return response.data.data;
  },

  async assign(payload: {
    officer_id: number;
    window_id: number;
    level: OfficerWindowLevel;
    subcity_id?: number | string;
    woreda_id?: number | string;
  }) {
    const response = await api.post("/officer-window-assignment/assign", payload);
    return response.data;
  },

  async unassign(payload: {
    officer_id: number;
    window_id: number;
    level: OfficerWindowLevel;
    subcity_id?: number | string;
    woreda_id?: number | string;
  }) {
    const response = await api.delete("/officer-window-assignment/unassign", {
      data: payload,
    });
    return response.data;
  },

  async officersForWindow(windowId: number, level?: OfficerWindowLevel) {
    const response = await api.get(`/officer-window-assignment/windows/${windowId}/officers`, {
      params: { level },
    });
    return response.data.data;
  },
};