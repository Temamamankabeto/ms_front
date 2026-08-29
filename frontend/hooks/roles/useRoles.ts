"use client";

import { useEffect, useState } from "react";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/roles/service";

export const useRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);

      const data = await getRoles();

      console.log("ROLES =>", data);

      setRoles(data || []);

    } catch (err: any) {
      console.error(err);

      setError(err.message || "Failed loading roles");
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (name: string) => {
    await createRole({ name });

    fetchRoles();
  };

  const editRole = async (id: number, name: string) => {
    await updateRole(id, { name });

    fetchRoles();
  };

  const removeRole = async (id: number) => {
    await deleteRole(id);

    fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    addRole,
    editRole,
    removeRole,
  };
};