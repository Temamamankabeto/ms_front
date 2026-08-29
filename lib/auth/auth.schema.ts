import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const customerRegisterSchema = z
  .object({
    name: z.string().min(2, "Name is required").max(255),
    email: z.string().email("Valid email is required").max(255),
    phone: z.string().min(6, "Phone number is required").max(20),
    address: z.string().max(500).optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

export type LoginPayload = z.infer<typeof loginSchema>;
export type CustomerRegisterPayload = z.infer<typeof customerRegisterSchema>;
