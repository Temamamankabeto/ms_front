"use client";

import Image from "next/image";
import type { ComponentType, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService, type AuthUser } from "@/services/auth/auth.service";

type ProfileUser = AuthUser & {
  role?: string | null;
  roles?: Array<string | { name?: string | null }> | null;
  city_id?: number | string | null;
  subcity_id?: number | string | null;
  woreda_id?: number | string | null;
  city?: { id?: number | string; name?: string | null } | null;
  subcity?: { id?: number | string; name?: string | null } | null;
  woreda?: { id?: number | string; name?: string | null } | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  phone?: string | null;
  profile_image_url?: string | null;
  photo_url?: string | null;
};

function initials(name?: string | null) {
  return (
    (name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function roleText(user: ProfileUser | null) {
  if (!user) return "User";

  const roles = user.roles as Array<string | { name?: string | null }> | undefined | null;
  const firstRole = Array.isArray(roles) ? roles[0] : null;

  if (typeof firstRole === "string") return firstRole;

  const roleObject = firstRole as { name?: string | null } | null;

  return roleObject?.name || user.role || "User";
}

function locationText(user: ProfileUser | null) {
  if (!user) return "-";

  return (
    user.woreda?.name ||
    user.subcity?.name ||
    user.city?.name ||
    [
      user.city_id ? `City #${user.city_id}` : null,
      user.subcity_id ? `Subcity #${user.subcity_id}` : null,
      user.woreda_id ? `Woreda #${user.woreda_id}` : null,
    ]
      .filter(Boolean)
      .join(" / ") ||
    "-"
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");

  const imagePreview = useMemo(() => {
    if (!image) return user?.profile_image_url || user?.photo_url || null;
    return URL.createObjectURL(image);
  }, [image, user?.profile_image_url, user?.photo_url]);

  function fillForm(data: AuthUser | ProfileUser | null) {
    if (!data) return;

    const profile = data as ProfileUser;

    setUser(profile);
    setName(profile.name || "");
    setGender(profile.gender || "");
    setDateOfBirth(profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : "");
    setAddress(profile.address || "");
  }

  async function loadProfile() {
    setLoading(true);

    const storedUser = authService.getStoredUser();
    fillForm(storedUser);

    try {
      const data = await authService.profile();

      fillForm(data);
    } catch (error) {
      if (!storedUser) {
        toast.error(error instanceof Error ? error.message : "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const payload = new FormData();
      payload.append("name", name);
      if (gender) payload.append("gender", gender);
      if (dateOfBirth) payload.append("date_of_birth", dateOfBirth);
      payload.append("address", address || "");

      if (image) {
        payload.append("profile_image", image);
      }

      const updated = await authService.updateProfile(payload);

      fillForm(updated);
      setImage(null);

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();

    if (newPassword !== newPasswordConfirmation) {
      toast.error("Password confirmation does not match");
      return;
    }

    setSavingPassword(true);

    try {
      await authService.changeOwnPassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");

      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-background p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={imagePreview || undefined} alt={user?.name || "Profile"} />
                  <AvatarFallback className="text-2xl">{initials(user?.name)}</AvatarFallback>
                </Avatar>

                {imagePreview && (
                  <Image src={imagePreview} alt="" width={1} height={1} className="hidden" unoptimized />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">My Profile</p>
                <h1 className="text-2xl font-bold md:text-3xl">{user?.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {roleText(user)} · {locationText(user)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Account information is protected
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={submitProfile} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} required />
                </div>

                <ReadOnlyField icon={Mail} label="Email" value={user?.email || "-"} />
                <ReadOnlyField icon={Phone} label="Phone" value={user?.phone || "-"} />
                <ReadOnlyField icon={MapPin} label="Location" value={locationText(user)} />

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(event) => setAddress(event.target.value)} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Profile Image</Label>
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed p-4 transition hover:bg-muted">
                    <span className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Camera className="h-5 w-5" />
                      {image ? image.name : "Choose profile image"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(event) => setImage(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              <Button disabled={savingProfile} className="rounded-2xl">
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Password
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={submitPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={newPasswordConfirmation}
                  onChange={(event) => setNewPasswordConfirmation(event.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button disabled={savingPassword} className="w-full rounded-2xl">
                {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
