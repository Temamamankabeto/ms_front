import api from "@/lib/api";
import type { AuditLogFilters, AuditLogItem, PaginatedResponse } from "@/types/audit-log-management/audit-log.type";

function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) {
  const output: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    output[key] = value;
  });

  return output;
}

function extractRows<T>(body: unknown): T[] {
  const root = body as Record<string, unknown> | null;
  const data = root && typeof root === "object" ? root.data : undefined;

  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }

  return [];
}

function paginated<T>(body: unknown): PaginatedResponse<T> {
  const root = body as { success?: boolean; message?: string; data?: unknown; meta?: Record<string, unknown> } | null;
  const rows = extractRows<T>(body);
  const data = root && typeof root === "object" ? root.data : undefined;
  const paginator = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : root && typeof root === "object"
      ? root as Record<string, unknown>
      : {};
  const meta = root?.meta ?? paginator;

  return {
    success: root?.success,
    message: root?.message,
    data: rows,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? rows.length ?? 10),
      total: Number(meta.total ?? rows.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

export const auditLogService = {
  async list(params: AuditLogFilters = {}) {
    const response = await api.get("/admin/audit-logs", { params: cleanParams(params) });
    return paginated<AuditLogItem>(response.data);
  },
};

export default auditLogService;
