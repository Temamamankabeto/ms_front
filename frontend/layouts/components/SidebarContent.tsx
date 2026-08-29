"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { authService } from "@/services/auth/auth.service";
import {
  filterSidebarByPermissions,
  getSidebarForRole,
} from "@/config/sidebar.config";
import { normalizeRole } from "@/config/dashboard.config";
import { locationLevelLabel, roleLabel } from "@/config/roles.config";
import { cn } from "@/lib/utils";
import mesob from "@/app/mesob.jpg";

type SidebarContentProps = {
  collapsed?: boolean;
};

function isPathActive(pathname: string, href?: string) {
  if (!href || href === "#") return false;
  if (href === "/dashboard") return pathname === "/dashboard";

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarContent({ collapsed = false }: SidebarContentProps) {
  const pathname = usePathname();
  const user = authService.getStoredUser();
  const roles = authService.getStoredRoles();
  const role = roles[0] ?? user?.role ?? "super_admin";
  const roleKey = normalizeRole(role);
  const permissions = authService.getStoredPermissions();

  const roleSidebar = useMemo(
    () => getSidebarForRole(roleKey || role),
    [roleKey, role]
  );

  const sections = useMemo(
    () => filterSidebarByPermissions(roleSidebar, permissions),
    [roleSidebar, permissions]
  );

  const [manualOpenMenus, setManualOpenMenus] = useState<Record<string, boolean>>({});

  const locationScope = (user as any)?.location_level
    ? locationLevelLabel((user as any).location_level)
    : (user as any)?.woreda?.name ||
      (user as any)?.subcity?.name ||
      (user as any)?.city?.name ||
      "";

  function toggleMenu(label: string) {
    setManualOpenMenus((current) => ({
      ...current,
      [label]: !(current[label] ?? false),
    }));
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="border-b p-4">
        <div
          className={cn(
            "flex items-center rounded-2xl bg-muted/50 p-3 transition-all",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Image
              src={mesob}
              alt="Logo"
              width={150}
              height={150}
              className="h-5 w-5"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">
                ADAMA MESOB eService
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel(role)}
                {locationScope ? ` · ${locationScope}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 space-y-5 overflow-y-auto",
          collapsed ? "p-2" : "p-4"
        )}
      >
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            {!collapsed && (
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item.href);
                const hasChildren = Boolean(item.children?.length);
                const childIsActive = Boolean(
                  item.children?.some((child) => isPathActive(pathname, child.href))
                );

                const isOpen = manualOpenMenus[item.label] ?? childIsActive;

                if (hasChildren) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        title={collapsed ? item.label : undefined}
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "flex w-full items-center rounded-xl text-sm font-medium transition",
                          collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
                          childIsActive
                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />

                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 shrink-0 transition-transform duration-200",
                                isOpen && "rotate-90"
                              )}
                            />
                          </>
                        )}
                      </button>

                      {!collapsed && isOpen && (
                        <div className="ml-6 space-y-1 border-l pl-2">
                          {item.children?.map((child) => {
                            const childActive = isPathActive(pathname, child.href);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-muted hover:text-foreground",
                                  childActive &&
                                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                              >
                                <span className="truncate">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href ?? item.label}
                    href={item.href ?? "#"}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-xl text-sm font-medium transition",
                      collapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
                      active
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
