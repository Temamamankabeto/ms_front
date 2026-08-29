"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerRegisterSchema } from "@/lib/auth/auth.schema";
import { authService } from "@/services/auth/auth.service";

const initialForm = { name: "", email: "", phone: "", address: "", password: "", password_confirmation: "" };
type RegisterForm = typeof initialForm;
type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function updateField(name: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const payload = customerRegisterSchema.parse(form);
      const response = await authService.registerCustomer(payload);
      authService.saveSession(response);
      toast.success("Customer account created successfully");
      router.replace("/login");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const nextErrors: FieldErrors = {};
        for (const issue of error.issues) {
          nextErrors[issue.path[0] as keyof RegisterForm] = issue.message;
        }
        setErrors(nextErrors);
        toast.error("Please correct the highlighted fields");
      } else {
        toast.error(error instanceof Error ? error.message : "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create customer account</CardTitle>
          <CardDescription>Register as a customer to browse menu items and place orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} autoComplete="name" />
              {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} autoComplete="email" />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} autoComplete="tel" />
                {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} autoComplete="street-address" />
              {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} autoComplete="new-password" />
                {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={(e) => updateField("password_confirmation", e.target.value)} autoComplete="new-password" />
                {errors.password_confirmation ? <p className="text-xs text-destructive">{errors.password_confirmation}</p> : null}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
