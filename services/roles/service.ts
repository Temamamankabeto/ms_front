import api from "@/lib/api";
import { ROLE_OPTIONS, roleLabel } from "@/config/roles.config";

export const getRoles = async () => {
  const res = await api.get("/admin/roles");
  const roles = res.data.data || [];

  if (!roles.length) {
    return ROLE_OPTIONS.map((role, index) => ({
      id: index + 1,
      name: role.name,
      label: role.label,
      is_scoped: role.isScoped,
    }));
  }

  return roles.map((role: any) => ({
    ...role,
    label: role.label || roleLabel(role.name),
  }));
};

export const createRole = async (data: { name: string }) => {
  const res = await api.post("/admin/roles", data);

  return res.data.data;
};

export const updateRole = async (
  id: number,
  data: { name: string }
) => {
  const res = await api.put(`/admin/roles/${id}`, data);

  return res.data.data;
};

export const deleteRole = async (id: number) => {
  const res = await api.delete(`/admin/roles/${id}`);

  return res.data;
};
