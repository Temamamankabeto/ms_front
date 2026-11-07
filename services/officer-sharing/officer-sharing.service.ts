import api from "@/lib/api";

export const officerSharingService = {
  async windows(params?: { service_id?: number; level?: string }) {
    const response = await api.get("/officer/sharing/windows", { params });
    return response.data.data;
  },

  async officers(windowId: number) {
    const response = await api.get(`/officer/sharing/windows/${windowId}/officers`);
    return response.data.data;
  },

  async share(applicationId: number, payload: {
    to_window_id: number;
    to_officer_id: number;
    note?: string;
  }) {
    const response = await api.post(`/officer/applications/${applicationId}/share-to-officer`, payload);
    return response.data;
  },
};
