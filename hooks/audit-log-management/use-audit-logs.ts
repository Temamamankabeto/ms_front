import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log-management/audit-log.service";
import type { AuditLogFilters } from "@/types/audit-log-management/audit-log.type";

export function useAuditLogsQuery(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditLogService.list(filters),
  });
}
