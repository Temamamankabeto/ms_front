import axios from "@/lib/api";
import { AuditLog } from "@/types/audit-log";

const BASE_URL = "/admin/audit-logs";

export const auditLogService = {
  getAll: async (page = 1) => {
    const res = await axios.get(`${BASE_URL}?page=${page}`);
    return res.data;
  },

  getById: async (id: number): Promise<AuditLog> => {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (data: Partial<AuditLog>) => {
    const res = await axios.post(BASE_URL, data);
    return res.data;
  },

  update: async (id: number, data: Partial<AuditLog>) => {
    const res = await axios.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  remove: async (id: number) => {
    const res = await axios.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};