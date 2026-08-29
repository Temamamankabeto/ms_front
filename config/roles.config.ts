export type LocationLevel = "city" | "subcity" | "woreda" | "";

export type AppRoleName =
  | "super_admin"
  | "manager"
  | "admin"
  | "back_officer"
  | "front_officer"
  | "feedback"
  | "customer";

export type RoleOption = {
  name: AppRoleName;
  label: string;
  isScoped: boolean;
};

export const LOCATION_LEVELS: Array<{ value: Exclude<LocationLevel, "">; label: string }> = [
  { value: "city", label: "City Level" },
  { value: "subcity", label: "Subcity Level" },
  { value: "woreda", label: "Woreda Level" },
];

export const ROLE_OPTIONS: RoleOption[] = [
  { name: "super_admin", label: "Super Admin", isScoped: false },
  { name: "manager", label: "Manager", isScoped: true },
  { name: "admin", label: "Admin", isScoped: true },
  { name: "back_officer", label: "Back Officer", isScoped: true },
  { name: "front_officer", label: "Front Officer", isScoped: true },
  { name: "feedback", label: "Feedback Officer", isScoped: true },
  { name: "customer", label: "Customer", isScoped: false },
];

export function normalizeRoleName(role?: string | null): AppRoleName {
  const value = String(role ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_")
    .trim();

  if (value === "super" || value === "superadmin" || value === "super_admin") return "super_admin";
  if (value === "manager" || value === "managemer") return "manager";
  if (value === "admin" || value === "administrator") return "admin";

  if (
    value === "city_manager" ||
    value === "subcity_manager" ||
    value === "woreda_manager"
  ) return "manager";

  if (
    value === "city_admin" ||
    value === "subcity_admin" ||
    value === "woreda_admin"
  ) return "admin";

  if (
    value === "back" ||
    value === "backofficer" ||
    value === "back_officer" ||
    value === "city_back_officer" ||
    value === "subcity_back_officer" ||
    value === "woreda_back_officer"
  ) return "back_officer";

  if (
    value === "front" ||
    value === "frontofficer" ||
    value === "front_officer" ||
    value === "city_front_officer" ||
    value === "subcity_front_officer" ||
    value === "woreda_front_officer"
  ) return "front_officer";

  if (value === "customer") return "customer";

  if (
    value === "feedback" ||
    value === "feedback_officer" ||
    value === "feedbackofficer" ||
    value === "city_feedback" ||
    value === "subcity_feedback" ||
    value === "woreda_feedback"
  ) return "feedback";

  return "super_admin";
}

export function getRoleOption(role?: string | null): RoleOption {
  return ROLE_OPTIONS.find((item) => item.name === normalizeRoleName(role)) ?? ROLE_OPTIONS[0];
}


export function roleLabel(role?: string | null) {
  return getRoleOption(role).label;
}

export function locationLevelFromIds(cityId?: unknown, subcityId?: unknown, woredaId?: unknown): LocationLevel {
  if (woredaId) return "woreda";
  if (subcityId) return "subcity";
  if (cityId) return "city";
  return "";
}

export function locationLevelLabel(level?: string | null) {
  return LOCATION_LEVELS.find((item) => item.value === level)?.label ?? "";
}