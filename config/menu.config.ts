// ========================================================
// dashboard.config.ts
// ========================================================

export type AppRoleKey =
  | "super-admin"
  | "subcity-admin"
  | "woreda-admin"
  | "front-officer"
  | "back-officer"
  | "customer";

/* ========================================================
 DASHBOARD ROUTES
======================================================== */

export const dashboardConfig: Record<
  AppRoleKey,
  {
    route: string;
  }
> = {
  "super-admin": {
    route: "/dashboard/super-admin",
  },

  "subcity-admin": {
    route: "/dashboard/subcity-admin",
  },

  "woreda-admin": {
    route: "/dashboard/woreda-admin",
  },

  "front-officer": {
    route: "/dashboard/front-officer",
  },

  "back-officer": {
    route: "/dashboard/back-officer",
  },

  customer: {
    route: "/dashboard/customer",
  },
};

/* ========================================================
 NORMALIZE ROLE
======================================================== */

export function normalizeRole(
  role?: string | null
): AppRoleKey {
  switch (role) {
    case "super-admin":
      return "super-admin";

    case "subcity-admin":
      return "subcity-admin";

    case "woreda-admin":
      return "woreda-admin";

    case "front-officer":
      return "front-officer";

    case "back-officer":
      return "back-officer";

    default:
      return "customer";
  }
}