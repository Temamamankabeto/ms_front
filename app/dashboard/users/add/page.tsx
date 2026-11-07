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
  officer_code: string;
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
  officer_code: "",
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

type ValidationErrors = Record<string, string[]>;

function friendlyValidationMessage(field: string, message: string): string {
  const text = message.toLowerCase();
  if (field === "password" && (text.includes("data leak") || text.includes("compromised") || text.includes("pwned"))) {
    return "This password is not secure. Choose a different password.";
  }
  if (text.includes("already been taken") || text.includes("already registered")) {
    if (field === "email") return "This email is already registered.";
    if (field === "phone") return "This phone number is already registered.";
    if (field === "officer_code") return "This officer code is already in use.";
  }
  if (field === "phone" && (text.includes("invalid") || text.includes("format"))) {
    return "Enter a valid phone number.";
  }
  if (text.includes("required")) {
    const label = field.replace(/_/g, " ");
    return `Please enter or select ${label}.`;
  }
  if (field === "password" && text.includes("at least")) return "Password must be at least 8 characters.";
  return message;
}

function parseApiError(error: unknown): { message: string; fields: ValidationErrors } {
  const err = error as {
    response?: { data?: unknown };
    data?: unknown;
    message?: string;
  } | null;
  const raw = err?.response?.data ?? err?.data;
  const payload = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const nested = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const rawErrors = payload.errors ?? nested.errors;
  const fields: ValidationErrors = {};
  if (rawErrors && typeof rawErrors === "object" && !Array.isArray(rawErrors)) {
    for (const [field, value] of Object.entries(rawErrors)) {
      const messages = (Array.isArray(value) ? value : [value])
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => friendlyValidationMessage(field, item));
      if (messages.length) fields[field] = messages;
    }
  }
  const rawMessage = typeof payload.message === "string" ? payload.message : err?.message;
  const generic = !rawMessage || /^(validation failed\.?|unprocessable entity|request failed with status code 422)$/i.test(rawMessage.trim());
  const message = Object.keys(fields).length
    ? "Please correct the highlighted fields."
    : generic ? "Unable to save user. Please check the form and try again." : rawMessage;
  return { message, fields };
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

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");

  function clearError(field: string) {
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError("");
  }

  function fieldError(field: string) {
    return validationErrors[field]?.length ? (
      <p role="alert" className="mt-1 text-sm text-destructive">{validationErrors[field].join(" ")}</p>
    ) : null;
  }

  const selectedRole = useMemo(() => getRoleOption(form.role), [form.role]);

  const roleOptions = useMemo(() => {
    const base = roles || [];

    if (authRole === "super_admin") {
      return base;
    }
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
    if (form.officer_code.trim().length > 10) return toast.error("Officer Code must be 10 characters or fewer"), false;
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
    setValidationErrors({});
    setSubmitError("");
    if (!validate()) return;

    createUser.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        officer_code: form.officer_code.trim() || undefined,
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
          const result = parseApiError(error);
          setValidationErrors(result.fields);
          setSubmitError(result.message);
          if (!Object.keys(result.fields).length) toast.error(result.message);
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
          {submitError && <div role="alert" aria-live="assertive" className="col-span-full rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><strong>Unable to create user:</strong> {submitError}</div>}
          <div className="min-w-0" onChangeCapture={() => clearError("name")}>
<Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
{fieldError("name")}
</div>
          <div className="min-w-0" onChangeCapture={() => clearError("email")}>
<Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
{fieldError("email")}
</div>
          <div className="min-w-0" onChangeCapture={() => clearError("phone")}>
<Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
{fieldError("phone")}
</div>
          <div className="space-y-1">
            <label htmlFor="officer-code" className="text-sm font-medium">Officer Code (optional)</label>
            <div className="min-w-0" onChangeCapture={() => clearError("officer_code")}>
<Input id="officer-code" placeholder="e.g. OFF-001" maxLength={10} value={form.officer_code} onChange={(e) => setForm({ ...form, officer_code: e.target.value })} />
{fieldError("officer_code")}
</div>
          </div>

          <div className="min-w-0" onChangeCapture={() => clearError("gender")}>
<select className="rounded-md border p-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
{fieldError("gender")}
</div>

          <div className="min-w-0" onChangeCapture={() => clearError("password")}>
<Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
{fieldError("password")}
</div>
          <div className="min-w-0" onChangeCapture={() => clearError("confirm_password")}>
<Input type="password" placeholder="Confirm Password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />
{fieldError("confirm_password")}
</div>
          <div className="min-w-0" onChangeCapture={() => clearError("date_of_birth")}>
<Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
{fieldError("date_of_birth")}
</div>
          <div className="min-w-0" onChangeCapture={() => clearError("address")}>
<Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
{fieldError("address")}
</div>

          <div className="min-w-0" onChangeCapture={() => clearError("role")}>
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
{fieldError("role")}
</div>

          {selectedRole.isScoped && (
            <div className="min-w-0" onChangeCapture={() => clearError("location_level")}>
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
{fieldError("location_level")}
</div>
          )}

          {requiresCity && (
            <div className="min-w-0" onChangeCapture={() => clearError("city_id")}>
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
{fieldError("city_id")}
</div>
          )}

          {requiresSubcity && (
            <div className="min-w-0" onChangeCapture={() => clearError("subcity_id")}>
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
{fieldError("subcity_id")}
</div>
          )}

          {requiresWoreda && (
            <div className="min-w-0" onChangeCapture={() => clearError("woreda_id")}>
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
{fieldError("woreda_id")}
</div>
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
