import api from "@/lib/api";

export const serviceService = {
  async getAll() {
    const response = await api.get("/admin/services");
    return response.data;
  },
    async getDropdownServices() {
    const response = await api.get("/admin/services/dropdown");
    return response.data;
  },
};

