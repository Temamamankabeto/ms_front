export type UserStatus = "active" | "disabled";

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

/* ================= LOCATION ================= */

export type LocationItem = {
  id: number | string;
  name: string;
};

/* ================= USER ================= */

export type UserItem = {
  id: number | string;

  name: string;
  email: string;

  phone?: string | null;

  status?: UserStatus;

  role?: string;

  role_names?: string[];

  date_of_birth?: string | null;

  address?: string | null;

  gender?: string | null;

  city_id?: number | string | null;

  subcity_id?: number | string | null;

  woreda_id?: number | string | null;

  city?: LocationItem | null;

  subcity?: LocationItem | null;

  woreda?: LocationItem | null;

  location_level?: string | null;

  is_active?: boolean;

  roles?: Array<
    string | { id?: number | string; name: string }
  >;

  profile_image_url?: string | null;

  created_at?: string;

  updated_at?: string;
};

/* ================= USER FILTERS ================= */

export type UserListParams = {
  search?: string;

  status?: UserStatus | "all";

  role?: string;

  city_id?: number | string;

  subcity_id?: number | string;

  woreda_id?: number | string;

  page?: number;

  per_page?: number;
};

/* ================= CREATE USER ================= */

export type CreateUserPayload = {
  name: string;

  email: string;

  phone: string;

  password: string;

  role: string;

  gender?: string;

  address?: string;

  date_of_birth?: string;

  city_id?: number;

  subcity_id?: number;

  woreda_id?: number;
};

/* ================= UPDATE USER ================= */

export type UpdateUserPayload = {
  name: string;

  email: string;

  phone: string;

  role: string;

  gender?: string;

  address?: string;

  date_of_birth?: string;

  city_id?: number;

  subcity_id?: number;

  woreda_id?: number;
};

/* ================= PASSWORD ================= */

export type ResetUserPasswordPayload = {
  new_password: string;
};

/* ================= ROLE ================= */

export type AssignUserRolePayload = {
  role: string;
};

export type RoleItem = {
  id: number | string;

  name: string;

  guard_name?: string;

  created_at?: string;

  updated_at?: string;
};

export type RoleListParams = {
  search?: string;

  page?: number;

  per_page?: number;
};

export type RolePayload = {
  name: string;
};

/* ================= PERMISSION ================= */

export type PermissionItem = {
  id: number | string;

  name: string;

  guard_name?: string;

  created_at?: string;

  updated_at?: string;
};

export type PermissionListParams = {
  search?: string;

  all?: boolean;

  page?: number;

  per_page?: number;
};

export type PermissionPayload = {
  name: string;
};

export type AssignRolePermissionsPayload = {
  permissions: string[];
};

export type RolePermissionResult = {
  role_id: number | string;

  assigned_count: number;

  permissions: string[];
};