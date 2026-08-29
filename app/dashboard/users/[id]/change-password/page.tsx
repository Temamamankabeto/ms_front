"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useChangePassword } from "@/hooks/user/useChangePassword";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { id } = useParams();
  const router = useRouter();

  const changePassword = useChangePassword();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!form.current_password) {
      toast.error("Current password is required");
      return false;
    }

    if (!form.new_password) {
      toast.error("New password is required");
      return false;
    }

    if (form.new_password.length < 8) {
      toast.error("Minimum 8 characters required");
      return false;
    }

    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!/[A-Z]/.test(form.new_password)) {
      toast.error("Must contain 1 uppercase letter");
      return false;
    }

    if (!/[!@#$%^&*]/.test(form.new_password)) {
      toast.error("Must contain 1 special character");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = () => {
    if (!validate()) return;

    changePassword.mutate(
      {
        id: Number(id),
        current_password: form.current_password,
        new_password: form.new_password,
      },
      {
        onSuccess: () => {
          toast.success("Password changed successfully");
          router.push("/dashboard/users");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              "Failed to change password"
          );
        },
      }
    );
  };

  return (
    <div className="p-6 flex justify-center">

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            type="password"
            placeholder="Current Password"
            value={form.current_password}
            onChange={(e) =>
              setForm({
                ...form,
                current_password: e.target.value,
              })
            }
          />

          <Input
            type="password"
            placeholder="New Password"
            value={form.new_password}
            onChange={(e) =>
              setForm({
                ...form,
                new_password: e.target.value,
              })
            }
          />

          <Input
            type="password"
            placeholder="Confirm New Password"
            value={form.confirm_password}
            onChange={(e) =>
              setForm({
                ...form,
                confirm_password: e.target.value,
              })
            }
          />

          {/* RULES */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Minimum 8 characters</p>
            <p>• 1 uppercase letter</p>
            <p>• 1 special character</p>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={changePassword.isPending}
          >
            Update Password
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}