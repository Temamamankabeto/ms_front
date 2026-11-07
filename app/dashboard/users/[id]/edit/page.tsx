"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUsers, useUpdateUser } from "@/hooks/user/useUsers";
import { useCities } from "@/hooks/location/useCities";
import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";
import { useRoles } from "@/hooks/roles/useRoles";
import {
  getRoleOption,
  locationLevelFromIds,
  LOCATION_LEVELS,
  LocationLevel,
  roleLabel,
} from "@/config/roles.config";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

const { data } = useUsers({
  page: 1,
});
  const updateUser = useUpdateUser();

  const users = data?.data || [];
  const user = users.find((item: any) => item.id == id);

  const { data: citiesData } = useCities(1);
  const { data: subcitiesData } = useSubcities(1);
  const { data: woredasData } = useWoredas(1);
  const { roles } = useRoles();
const cities = Array.isArray(citiesData?.data)
  ? citiesData.data
  : Array.isArray(citiesData)
  ? citiesData
  : [];

const subcities = Array.isArray(subcitiesData?.data)
  ? subcitiesData.data
  : Array.isArray(subcitiesData)
  ? subcitiesData
  : [];

const woredas = Array.isArray(woredasData?.data)
  ? woredasData.data
  : Array.isArray(woredasData)
  ? woredasData
  : [];

  const [form, setForm] = useState<Form>({
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

  // Preserve the selected role when editing, even if the role-list endpoint is filtered.
  const editableRoles = useMemo(() => {
    const available = roles || [];
    if (!form.role || available.some((role: any) => role.name === form.role)) {
      return available;
    }
    return [...available, { name: form.role, label: roleLabel(form.role) }];
  }, [roles, form.role]);

  const filteredSubcities = useMemo(() => {
  if (!Array.isArray(subcities)) return [];

  return subcities.filter(
    (subcity: any) =>
      Number(subcity.city_id) === Number(form.city_id)
  );
}, [subcities, form.city_id]);

const filteredWoredas = useMemo(() => {
  if (!Array.isArray(woredas)) return [];

  return woredas.filter(
    (woreda: any) =>
      Number(woreda.subcity_id) === Number(form.subcity_id)
  );
}, [woredas, form.subcity_id]);


  const requiresCity = selectedRole.isScoped && ["city", "subcity", "woreda"].includes(form.location_level);
  const requiresSubcity = selectedRole.isScoped && ["subcity", "woreda"].includes(form.location_level);
  const requiresWoreda = selectedRole.isScoped && form.location_level === "woreda";

  useEffect(() => {
    if (!user) return;

    const roleName = user.role || user.role_names?.[0] || user.roles?.[0]?.name || "";
    const role = getRoleOption(roleName);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      officer_code: user.officer_code || "",
      password: "",
      confirm_password: "",
      date_of_birth: user.date_of_birth || "",
      address: user.address || "",
      gender: user.gender || "",
      role: roleName,
      location_level: role.isScoped
        ? user.location_level || locationLevelFromIds(user.city_id, user.subcity_id, user.woreda_id) || "city"
        : "",
      city_id: user.city_id || "",
      subcity_id: user.subcity_id || "",
      woreda_id: user.woreda_id || "",
    });
  }, [user]);

  function reset() {
    if (!user) return;

    const roleName = user.role || user.role_names?.[0] || user.roles?.[0]?.name || "";
    const role = getRoleOption(roleName);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      officer_code: user.officer_code || "",
      password: "",
      confirm_password: "",
      date_of_birth: user.date_of_birth || "",
      address: user.address || "",
      gender: user.gender || "",
      role: roleName,
      location_level: role.isScoped
        ? user.location_level || locationLevelFromIds(user.city_id, user.subcity_id, user.woreda_id) || "city"
        : "",
      city_id: user.city_id || "",
      subcity_id: user.subcity_id || "",
      woreda_id: user.woreda_id || "",
    });
  }

  function validate() {
    if (form.officer_code.trim().length > 10) { toast.error("Officer Code must be 10 characters or fewer"); return false; }
    if (!form.role) {
      toast.error("Role is required");
      return false;
    }

    if (selectedRole.isScoped && !form.location_level) {
      toast.error("Location level is required for this role");
      return false;
    }

    if (requiresCity && !form.city_id) {
      toast.error("City is required for this level");
      return false;
    }

    if (requiresSubcity && !form.subcity_id) {
      toast.error("Subcity is required for this level");
      return false;
    }

    if (requiresWoreda && !form.woreda_id) {
      toast.error("Woreda is required for this level");
      return false;
    }

    if (form.password && form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  }

  function handleUpdate() {
    setValidationErrors({});
    setSubmitError("");
    if (!validate()) return;

    updateUser.mutate(
      {
        id: Number(id),
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          officer_code: form.officer_code.trim() || null,
          address: form.address || undefined,
          date_of_birth: form.date_of_birth || undefined,
          gender: form.gender || undefined,
          role: form.role,
          location_level: selectedRole.isScoped ? form.location_level : undefined,
          city_id: requiresCity ? form.city_id : undefined,
          subcity_id: requiresSubcity ? form.subcity_id : undefined,
          woreda_id: requiresWoreda ? form.woreda_id : undefined,
          ...(form.password ? { password: form.password } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("User updated successfully");
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Edit User</h1>

        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Update User Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Role controls responsibility. Location level controls where the user can work.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {submitError && <div role="alert" aria-live="assertive" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><strong>Unable to update user:</strong> {submitError}</div>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="min-w-0" onChangeCapture={() => clearError("name")}>
<Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
{fieldError("name")}
</div>
            <div className="min-w-0" onChangeCapture={() => clearError("email")}>
<Input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
{fieldError("email")}
</div>
            <div className="min-w-0" onChangeCapture={() => clearError("phone")}>
<Input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
{fieldError("phone")}
</div>
          <div className="space-y-1">
            <label htmlFor="officer-code" className="text-sm font-medium">Officer Code (optional)</label>
            <div className="min-w-0" onChangeCapture={() => clearError("officer_code")}>
<Input id="officer-code" placeholder="e.g. OFF-001" maxLength={10} value={form.officer_code} onChange={(e) => setForm({ ...form, officer_code: e.target.value })} />
{fieldError("officer_code")}
</div>
          </div>
            <div className="min-w-0" onChangeCapture={() => clearError("date_of_birth")}>
<Input placeholder="Date of Birth" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
{fieldError("date_of_birth")}
</div>
            <div className="min-w-0" onChangeCapture={() => clearError("address")}>
<Input placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
{fieldError("address")}
</div>

            <div className="min-w-0" onChangeCapture={() => clearError("gender")}>
<select className="rounded border p-2" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as any })}>
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
{fieldError("gender")}
</div>

            <div className="min-w-0" onChangeCapture={() => clearError("role")}>
<select
              className="rounded border p-2"
              value={form.role}
              onChange={(event) => {
                const role = getRoleOption(event.target.value);

                setForm({
                  ...form,
                  role: event.target.value,
                  location_level: role.isScoped ? "city" : "",
                  city_id: "",
                  subcity_id: "",
                  woreda_id: "",
                });
              }}
            >
              <option value="">Role</option>
              {editableRoles.map((role: any) => (
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
                className="rounded border p-2"
                value={form.location_level}
                onChange={(event) =>
                  setForm({
                    ...form,
                    location_level: event.target.value as LocationLevel,
                    city_id: "",
                    subcity_id: "",
                    woreda_id: "",
                  })
                }
              >
                {LOCATION_LEVELS.map((level) => (
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
                className="rounded border p-2"
                value={form.city_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    city_id: Number(event.target.value),
                    subcity_id: "",
                    woreda_id: "",
                  })
                }
              >
                <option value="">City *</option>
                {cities.map((city: any) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
{fieldError("city_id")}
</div>
            )}

            {requiresSubcity && (
              <div className="min-w-0" onChangeCapture={() => clearError("subcity_id")}>
<select
                className="rounded border p-2"
                value={form.subcity_id}
                disabled={!form.city_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subcity_id: Number(event.target.value),
                    woreda_id: "",
                  })
                }
              >
                <option value="">Subcity *</option>
                {filteredSubcities.map((subcity: any) => (
                  <option key={subcity.id} value={subcity.id}>
                    {subcity.name}
                  </option>
                ))}
              </select>
{fieldError("subcity_id")}
</div>
            )}

            {requiresWoreda && (
              <div className="min-w-0" onChangeCapture={() => clearError("woreda_id")}>
<select
                className="rounded border p-2"
                value={form.woreda_id}
                disabled={!form.subcity_id}
                onChange={(event) => setForm({ ...form, woreda_id: Number(event.target.value) })}
              >
                <option value="">Woreda *</option>
                {filteredWoredas.map((woreda: any) => (
                  <option key={woreda.id} value={woreda.id}>
                    {woreda.name}
                  </option>
                ))}
              </select>
{fieldError("woreda_id")}
</div>
            )}

            <div className="min-w-0" onChangeCapture={() => clearError("password")}>
<Input type="password" placeholder="New Password (optional)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
{fieldError("password")}
</div>
            <div className="min-w-0" onChangeCapture={() => clearError("confirm_password")}>
<Input type="password" placeholder="Confirm Password" value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} />
{fieldError("confirm_password")}
</div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={reset}>Reset</Button>
            <Button onClick={handleUpdate}>Update User</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
