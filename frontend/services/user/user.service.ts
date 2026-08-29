import axios from "@/lib/api";

/* ================= TYPES IMPORT ================= */

import type {
  UserItem,
  UserListParams,
  CreateUserPayload,
  UpdateUserPayload,
  ApiEnvelope,
  PaginatedResponse,
} from "@/types/user/user.type";

/* ================= GET USERS ================= */

export const getUsers = async (
  params: UserListParams
): Promise<PaginatedResponse<UserItem>> => {
  /*
  |--------------------------------------------------------------------------
  | CLEAN EMPTY FILTERS
  |--------------------------------------------------------------------------
  */

  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
    )
  );

  const res = await axios.get(
    "/api/admin/users",
    {
      params: cleanedParams,
    }
  );

  return res.data;
};

/* ================= GET SINGLE USER ================= */

export const getUser = async (
  id: number | string
): Promise<ApiEnvelope<UserItem>> => {
  const res = await axios.get(
    `/api/admin/users/${id}`
  );

  return res.data;
};

/* ================= CREATE USER ================= */

export const createUser = async (
  payload: CreateUserPayload
): Promise<ApiEnvelope<UserItem>> => {
  const res = await axios.post(
    "/api/admin/users",
    payload
  );

  return res.data;
};

/* ================= UPDATE USER ================= */

export const updateUser = async (
  id: number | string,
  payload: UpdateUserPayload
): Promise<ApiEnvelope<UserItem>> => {
  const res = await axios.put(
    `/api/admin/users/${id}`,
    payload
  );

  return res.data;
};

/* ================= DELETE USER ================= */

export const deleteUser = async (
  id: number | string
): Promise<ApiEnvelope<null>> => {
  const res = await axios.delete(
    `/api/admin/users/${id}`
  );

  return res.data;
};

/* ================= ASSIGN ROLE ================= */

export const assignUserRole = async (
  id: number | string,
  role: string
): Promise<ApiEnvelope<UserItem>> => {
  const res = await axios.post(
    `/api/admin/users/${id}/assign-role`,
    {
      role,
    }
  );

  return res.data;
};

/* ================= TOGGLE STATUS ================= */

export const toggleUserStatus = async (
  id: number | string
): Promise<ApiEnvelope<UserItem>> => {
  const res = await axios.patch(
    `/api/admin/users/${id}/toggle`
  );

  return res.data;
};