"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import PermissionGuard from "@/components/auth/permission-guard";

const permissionByPath = [
  { path: "/dashboard/users/permissions", permission: "permissions.read" },
  { path: "/dashboard/users/roles", permission: "roles.read" },
  { path: "/dashboard/users", permission: "users.read" },
];

export default function UserManagementRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const matched = permissionByPath.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  const permission = matched?.permission ?? "users.read";

  return <PermissionGuard permission={permission}>{children}</PermissionGuard>;
}
