export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

export type AuditLogActor = {
  id: number | string;
  name?: string | null;
  email?: string | null;
};

export type AuditLogItem = {
  id: number | string;
  actor_id?: number | string | null;
  user_id?: number | string | null;
  actor?: AuditLogActor | null;
  user?: AuditLogActor | null;
  role_name?: string | null;
  module?: string | null;
  entity_type?: string | null;
  entity_id?: number | string | null;
  target_type?: string | null;
  target_id?: number | string | null;
  action: string;
  message?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AuditLogFilters = {
  actor?: string;
  user_id?: string | number;
  action?: string;
  module?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};
