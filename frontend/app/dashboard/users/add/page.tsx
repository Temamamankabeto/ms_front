"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreateUser } from "@/hooks/user/useUsers";
import { useCities } from "@/hooks/location/useCities";
import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";
import { useRoles } from "@/hooks/roles/useRoles";
import { authService } from "@/services/auth/auth.service";
import { getRoleOption, LOCATION_LEVELS, LocationLevel, normalizeRoleName, roleLabel } from "@/config/roles.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function listFrom(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}

type Form = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
  address: string;
  gender: "male" | "female" | "other" | "";
  role: string;
  location_level: LocationLevel;
  city_id: number | "";
  subcity_id: number | "";
  woreda_id: number | "";
};

const initialForm: Form = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  date_of_birth: "",
  address: "",
  gender: "",
  role: "",
  location_level: "",
  city_id: "",
  subcity_id: "",
  woreda_id: "",
};

function userLevel(user: any): LocationLevel {
  if (user?.woreda_id) return "woreda";
  if (user?.subcity_id) return "subcity";
  if (user?.city_id) return "city";
  return "";
}

export default function AddUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const { data: citiesRaw } = useCities();
  const { data: subcitiesRaw } = useSubcities();
  const { data: woredasRaw } = useWoredas();
  const { roles } = useRoles();

  const cities = listFrom(citiesRaw);
  const subcities = listFrom(subcitiesRaw);
  const woredas = listFrom(woredasRaw);

  const authUser = authService.getStoredUser() as any;
  const authRole = normalizeRoleName(authService.getStoredRoles()[0] || authUser?.role);
  const authLevel = userLevel(authUser);

  const [form, setForm] = useState<Form>({
    ...initialForm,
    city_id: authLevel ? authUser?.city_id || "" : "",
    subcity_id: authLevel === "subcity" || authLevel === "woreda" ? authUser?.subcity_id || "" : "",
    woreda_id: authLevel === "woreda" ? authUser?.woreda_id || "" : "",
    location_level: authLevel || "",
  });

  const selectedRole = useMemo(() => getRoleOption(form.role), [form.role]);

  const roleOptions = useMemo(() => {
    const base = roles || [];

    if (authRole === "super_admin") return base;
    if (authRole !== "admin") return [];

    if (authLevel === "city") {
      return base.filter((role: any) => ["admin", "front_officer", "back_officer", "feedback"].includes(role.name));
    }

    if (authLevel === "subcity" || authLevel === "woreda") {
      return base.filter((role: any) => ["front_officer", "back_officer", "feedback"].includes(role.name));
    }

    return [];
  }, [roles, authRole, authLevel]);

  const levelOptions = useMemo(() => {
    if (authRole === "super_admin") return LOCATION_LEVELS;
    if (authRole !== "admin") return [];

    if (authLevel === "city") return LOCATION_LEVELS;
    if (authLevel === "subcity") return LOCATION_LEVELS.filter((level) => level.value === "subcity");
    if (authLevel === "woreda") return LOCATION_LEVELS.filter((level) => level.value === "woreda");

    return [];
  }, [authRole, authLevel]);

  const filteredSubcities = subcities.filter((subcity: any) => Number(subcity.city_id) === Number(form.city_id));
  const filteredWoredas = woredas.filter((woreda: any) => Number(woreda.subcity_id) === Number(form.subcity_id));

  const requiresCity = selectedRole.isScoped && ["city", "subcity", "woreda"].includes(form.location_level);
  const requiresSubcity = selectedRole.isScoped && ["subcity", "woreda"].includes(form.location_level);
  const requiresWoreda = selectedRole.isScoped && form.location_level === "woreda";

  function validate() {
    if (!form.name.trim()) return toast.error("Name is required"), false;
    if (!form.email.trim()) return toast.error("Email is required"), false;
    if (!form.phone.trim()) return toast.error("Phone is required"), false;
    if (!form.role) return toast.error("Role is required"), false;
    if (selectedRole.isScoped && !form.location_level) return toast.error("Location level is required"), false;
    if (requiresCity && !form.city_id) return toast.error("City is required"), false;
    if (requiresSubcity && !form.subcity_id) return toast.error("Subcity is required"), false;
    if (requiresWoreda && !form.woreda_id) return toast.error("Woreda is required"), false;
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters"), false;
    if (form.password !== form.confirm_password) return toast.error("Passwords do not match"), false;
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;

    createUser.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        date_of_birth: form.date_of_birth || undefined,
        address: form.address || undefined,
        gender: form.gender || undefined,
        role: form.role,
        location_level: selectedRole.isScoped ? form.location_level : undefined,
        city_id: requiresCity ? form.city_id : undefined,
        subcity_id: requiresSubcity ? form.subcity_id : undefined,
        woreda_id: requiresWoreda ? form.woreda_id : undefined,
      },
      {
        onSuccess: () => {
          const disabled = authRole === "admin" && ["subcity", "woreda"].includes(authLevel);
          toast.success(disabled ? "Officer created disabled. Activation request sent." : "User created successfully.");
          router.push("/dashboard/users");
        },
        onError: (error: any) => {
          const errors = error?.response?.data?.errors;
          if (errors) {
            const first = Object.values(errors)?.[0] as any;
            toast.error(Array.isArray(first) ? first[0] : "Validation failed.");
            return;
          }
          toast.error(error?.response?.data?.message || error?.message || "Failed to create user");
        },
      }
    );
  }

  return (
    <div className="p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <p className="text-sm text-muted-foreground">
            City admins create active users. Subcity/Woreda admins create disabled officers and send activation requests.
          </p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <select className="rounded-md border p-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input type="password" placeholder="Confirm Password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />
          <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <select
            className="rounded-md border p-2"
            value={form.role}
            onChange={(event) => {
              const role = getRoleOption(event.target.value);
              setForm({
                ...form,
                role: event.target.value,
                location_level: role.isScoped ? (levelOptions[0]?.value || "") : "",
              });
            }}
          >
            <option value="">Select Role</option>
            {roleOptions.map((role: any) => (
              <option key={role.id || role.name} value={role.name}>
                {role.label || roleLabel(role.name)}
              </option>
            ))}
          </select>

          {selectedRole.isScoped && (
            <select
              className="rounded-md border p-2"
              value={form.location_level}
              onChange={(event) => {
                const level = event.target.value as LocationLevel;
                setForm({
                  ...form,
                  location_level: level,
                  city_id: authLevel ? authUser?.city_id || "" : "",
                  subcity_id: level === "subcity" || level === "woreda" ? (authLevel === "subcity" || authLevel === "woreda" ? authUser?.subcity_id || "" : "") : "",
                  woreda_id: level === "woreda" ? (authLevel === "woreda" ? authUser?.woreda_id || "" : "") : "",
                });
              }}
            >
              <option value="">Select Level</option>
              {levelOptions.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          )}

          {requiresCity && (
            <select
              className="rounded-md border p-2"
              value={form.city_id}
              disabled={Boolean(authLevel)}
              onChange={(e) => setForm({ ...form, city_id: Number(e.target.value), subcity_id: "", woreda_id: "" })}
            >
              <option value="">City</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          )}

          {requiresSubcity && (
            <select
              className="rounded-md border p-2"
              value={form.subcity_id}
              disabled={authLevel === "subcity" || authLevel === "woreda"}
              onChange={(e) => setForm({ ...form, subcity_id: Number(e.target.value), woreda_id: "" })}
            >
              <option value="">Subcity</option>
              {filteredSubcities.map((subcity: any) => (
                <option key={subcity.id} value={subcity.id}>{subcity.name}</option>
              ))}
            </select>
          )}

          {requiresWoreda && (
            <select
              className="rounded-md border p-2"
              value={form.woreda_id}
              disabled={authLevel === "woreda"}
              onChange={(e) => setForm({ ...form, woreda_id: Number(e.target.value) })}
            >
              <option value="">Woreda</option>
              {filteredWoredas.map((woreda: any) => (
                <option key={woreda.id} value={woreda.id}>{woreda.name}</option>
              ))}
            </select>
          )}
        </CardContent>

        <div className="flex justify-end border-t p-4">
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
