"use client";

import { useEffect, useState } from "react";
import { auditLogService } from "@/services/audit-log.service";
import { AuditLog } from "@/types/audit-log";

export function useAuditLogs(page = 1) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getAll(page);
      setLogs(data.data); // Laravel pagination structure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return {
    logs,
    loading,
    refresh: fetchLogs,
  };
}
export function useCreateAuditLog() {
  const [loading, setLoading] = useState(false);

  const createLog = async (data: any) => {
    setLoading(true);
    try {
      return await auditLogService.create(data);
    } finally {
      setLoading(false);
    }
  };

  return { createLog, loading };
}
export function useUpdateAuditLog() {
  const [loading, setLoading] = useState(false);

  const updateLog = async (id: number, data: any) => {
    setLoading(true);
    try {
      return await auditLogService.update(id, data);
    } finally {
      setLoading(false);
    }
  };

  return { updateLog, loading };
}
export function useDeleteAuditLog() {
  const [loading, setLoading] = useState(false);

  const deleteLog = async (id: number) => {
    setLoading(true);
    try {
      return await auditLogService.remove(id);
    } finally {
      setLoading(false);
    }
  };

  return { deleteLog, loading };
}   