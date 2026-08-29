import { z } from "zod";

export const userStatusSchema = z.enum(["active", "disabled"]);

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(100),
  phone: z.string().min(3, "Phone is required").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(255),
  role: z.string().min(1, "Role is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(100),
  phone: z.string().min(3, "Phone is required").max(20),
  role: z.string().min(1, "Role is required"),
});

export const resetUserPasswordSchema = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters").max(255),
});

export const assignUserRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
});

export type CreateUserForm = z.infer<typeof createUserSchema>;
export type UpdateUserForm = z.infer<typeof updateUserSchema>;
export type ResetUserPasswordForm = z.infer<typeof resetUserPasswordSchema>;
export type AssignUserRoleForm = z.infer<typeof assignUserRoleSchema>;
