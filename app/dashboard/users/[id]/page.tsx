"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  useUsers,
} from "@/hooks/user/useUsers";

import { useUpdateUser } from "@/hooks/user/useUsers";

/* ================= PASSWORD VALIDATION ================= */
const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return minLength && hasUpper && hasSpecial;
};

export default function UserDetailsPage() {
  const { id } = useParams();

 const { data } = useUsers({
  page: 1,
});
  const user = data?.data?.find((u: any) => u.id == id);

  const updateUser = useUpdateUser();

  /* ================= STATE ================= */
  const [openPassword, setOpenPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) {
    return (
      <div className="p-10 text-center text-gray-500">
        User not found
      </div>
    );
  }

  /* ================= HANDLE PASSWORD ================= */
  const handleChangePassword = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      alert("Password must be 8 chars, 1 uppercase, 1 special character");
      return;
    }

    updateUser.mutate({
      id: user.id,
      data: {
        password,
      },
    });

    setOpenPassword(false);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* HEADER CARD */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6 flex items-center gap-6">

          {/* PROFILE */}
          <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-2xl font-bold">
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                className="w-full h-full object-cover"
              />
            ) : (
              user.name?.charAt(0)
            )}
          </div>

          {/* INFO */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-gray-500">{user.phone}</p>

            <div className="flex gap-2">
              <Badge
                className={
                  user.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {user.is_active ? "Active" : "Disabled"}
              </Badge>

              <Badge variant="outline">
                {user.role || "-"}
              </Badge>
            </div>
          </div>

          {/* ACTION */}
          <div className="ml-auto flex gap-2">
            <Button onClick={() => setOpenPassword(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span>{user.name}</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span>{user.email}</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span>{user.phone}</span>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span>{user.role || "-"}</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span>{user.is_active ? "Active" : "Disabled"}</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span>
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* ================= PASSWORD MODAL ================= */}
      {openPassword && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white w-[420px] p-6 rounded space-y-4">

            <h2 className="text-lg font-bold">Change Password</h2>

            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* PASSWORD RULES */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Minimum 8 characters</p>
              <p>• At least 1 uppercase letter</p>
              <p>• At least 1 special character</p>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenPassword(false)}
              >
                Cancel
              </Button>

              <Button
                disabled={!password || !confirmPassword}
                onClick={handleChangePassword}
              >
                Update
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}