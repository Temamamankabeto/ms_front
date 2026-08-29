import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(2, "Role name is required").max(120),
});

export const assignRolePermissionsSchema = z.object({
  permissions: z.array(z.string()).default([]),
});

export type RoleForm = z.infer<typeof roleSchema>;
export type AssignRolePermissionsForm = z.infer<typeof assignRolePermissionsSchema>;
