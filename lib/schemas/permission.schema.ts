import { z } from "zod";

export const permissionSchema = z.object({
  name: z.string().min(2, "Permission name is required").max(120),
});

export type PermissionForm = z.infer<typeof permissionSchema>;
