import api from "@/lib/api";

// --------------------
// GET permissions
// --------------------
export const getPermissions = async (
  page = 1,
  perPage = 50,
  search = ""
) => {
  const res = await api.get(
    `/admin/permissions?page=${page}&per_page=${perPage}&search=${search}`
  );

  return res.data.data; // ✅ FIXED (NO unwrap confusion)
};

// --------------------
// CREATE
// --------------------
export const createPermission = async (data: { name: string }) => {
  const res = await api.post("/admin/permissions", data);
  return res.data;
};

// --------------------
// UPDATE
// --------------------
export const updatePermission = async (id: number, data: { name: string }) => {
  const res = await api.put(`/admin/permissions/${id}`, data);
  return res.data;
};

// --------------------
// DELETE
// --------------------
export const deletePermission = async (id: number) => {
  const res = await api.delete(`/admin/permissions/${id}`);
  return res.data;
};

// --------------------
// ROLE PERMISSIONS (FIXED)
// --------------------
export const getRolePermissions = async (roleId: number) => {
  const res = await api.get(`/admin/roles/${roleId}/permissions`);
  return res.data.data; // ✅ MUST be array of strings
};

// --------------------
// ASSIGN ROLE PERMISSIONS
// --------------------
export const assignPermissions = async (
  roleId: number,
  permissions: string[]
) => {
  const res = await api.post(`/admin/roles/${roleId}/permissions`, {
    permissions,
  });

  return res.data;
};