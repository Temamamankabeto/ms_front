import api from "@/lib/api";
import {
  Office,
  OfficeListResponse,
  OfficeResponse,
} from "@/types/offices/office";

// GET
export const getOffices = async (): Promise<Office[]> => {
  const res = await api.get<OfficeListResponse>("/admin/offices");
  return res.data.data;
};

// CREATE
export const createOffice = async (data: { name: string }) => {
  const res = await api.post<OfficeResponse>("/admin/offices", data);
  return res.data.data;
};

// UPDATE
export const updateOffice = async (id: number, data: { name: string }) => {
  const res = await api.put<OfficeResponse>(`/admin/offices/${id}`, data);
  return res.data.data;
};

// DELETE
export const deleteOffice = async (id: number) => {
  const res = await api.delete(`/admin/offices/${id}`);
  return res.data;
};