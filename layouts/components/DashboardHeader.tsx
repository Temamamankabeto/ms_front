"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getDashboardForRole } from "@/config/dashboard.config";
import SidebarContent from "@/layouts/components/SidebarContent";
import api from "@/lib/api";
import { authService, type AuthUser } from "@/services/auth/auth.service";
import {
  customerNotificationService,
  type CustomerNotificationItem,
} from "@/services/customer/customer-notification.service";
import {
  officerNotificationService,
  type OfficerNotificationItem,
} from "@/services/officer/officer-notification.service";

const CUSTOMER_ROLES = new Set(["customer", "citizen"]);

type DashboardHeaderProps = {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
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

function normalizeRole(role?: string | null) {
  return String(role || "").toLowerCase().replaceAll(" ", "_");
}

function isOfficerRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized.includes("front_officer") || normalized.includes("back_officer");
}

function notificationIcon(type: CustomerNotificationItem["type"] | OfficerNotificationItem["type"]) {
  if (type === "payment") return <CreditCard className="h-4 w-4 text-emerald-600" />;
  if (type === "shared") return <Share2 className="h-4 w-4 text-purple-600" />;
  if (type === "returned_from_back") return <FileText className="h-4 w-4 text-amber-600" />;
  return <CalendarClock className="h-4 w-4 text-blue-600" />;
}

function listFromQueueResponse(response: any) {
  const body = response?.data ?? response;
  const data = body?.data ?? body;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function buildOfficerCountsFromQueue(applications: any[], role?: string | null) {
  const normalized = normalizeRole(role);
  const isBack = normalized.includes("back_officer");

  const newStatuses = isBack
    ? ["forwarded_to_back_officer"]
    : ["submitted", "pending", "resubmitted"];

  const sharedStatuses = isBack
    ? ["shared", "shared_to_back_officer"]
    : ["shared", "shared_to_front_officer"];

  const returnedStatuses = [
    "back_officer_approved",
    "back_officer_rejected",
    "returned_to_front_officer",
  ];

  const newItems = applications.filter((item) => newStatuses.includes(String(item.status)));
  const sharedItems = applications.filter((item) => sharedStatuses.includes(String(item.status)));
  const returnedItems = isBack
    ? []
    : applications.filter((item) => returnedStatuses.includes(String(item.status)));

  const toNotification = (item: any, type: OfficerNotificationItem["type"]): OfficerNotificationItem => ({
    id: `${type}-${item.id}`,
    type,
    title:
      type === "shared"
        ? "Application shared to you"
        : type === "returned_from_back"
          ? "Returned from Back Officer"
          : "New application",
    message:
      type === "shared"
        ? "A service application has been shared to your queue."
        : type === "returned_from_back"
          ? "Back Officer has returned a decision for this application."
          : "A new service application is waiting for your action.",
    application_id: item.id,
    tracking_number: item.tracking_number,
    service_name: item.service?.name,
    customer_name: item.customer?.name,
    window_name: item.current_window?.name,
    status: item.status,
    date: item.updated_at || item.submitted_at,
    href: `/dashboard/officer/applications/${item.id}`,
  });

  return {
    new_count: newItems.length,
    shared_count: sharedItems.length,
    returned_from_back_count: returnedItems.length,
    unread_count: newItems.length + sharedItems.length + returnedItems.length,
    notifications: [
      ...newItems.map((item) => toNotification(item, "new")),
      ...sharedItems.map((item) => toNotification(item, "shared")),
      ...returnedItems.map((item) => toNotification(item, "returned_from_back")),
    ],
  };
}

export default function DashboardHeader({
  sidebarCollapsed = false,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<Array<CustomerNotificationItem | OfficerNotificationItem>>([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [newApplicationCount, setNewApplicationCount] = useState(0);
  const [sharedCount, setSharedCount] = useState(0);
  const [returnedFromBackCount, setReturnedFromBackCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, [pathname]);

  const role = authService.getStoredRoles()[0] ?? user?.role ?? "customer";
  const normalizedRole = normalizeRole(role);
  const dashboard = getDashboardForRole(role);
  const isCustomer = useMemo(() => CUSTOMER_ROLES.has(normalizedRole), [normalizedRole]);
  const isOfficer = useMemo(() => isOfficerRole(role), [role]);

  useEffect(() => {
    if (!isCustomer && !isOfficer) return;

    let mounted = true;

    async function loadNotifications() {
      setLoadingNotifications(true);

      try {
        if (isCustomer) {
          const data = await customerNotificationService.list();
          if (!mounted) return;

          setNotifications(data.notifications ?? []);
          setAppointmentCount(data.appointment_count ?? 0);
          setPaymentCount(data.payment_count ?? 0);
          setNewApplicationCount(0);
          setSharedCount(0);
          setReturnedFromBackCount(0);
          setNotificationCount(data.unread_count ?? 0);
          return;
        }

        let officerData = await officerNotificationService.list();

        /*
        |--------------------------------------------------------------------------
        | Source of truth for count display
        |--------------------------------------------------------------------------
        | The officer list page is backed by /officer/applications/queue.
        | We also count from that queue here, so the navbar always matches the
        | applications visible on the officer queue page.
        |--------------------------------------------------------------------------
        */
        try {
          const queueResponse = await api.get("/officer/applications/queue");
          const queueItems = listFromQueueResponse(queueResponse);
          const queueCounts = buildOfficerCountsFromQueue(queueItems, role);

          officerData = {
            ...officerData,
            ...queueCounts,
            notifications: queueCounts.notifications.length
              ? queueCounts.notifications
              : officerData.notifications,
          };
        } catch {
          // Keep /officer/notifications result if queue fallback fails.
        }

        if (!mounted) return;

        setNotifications(officerData.notifications ?? []);
        setAppointmentCount(0);
        setPaymentCount(0);
        setNewApplicationCount(officerData.new_count ?? 0);
        setSharedCount(officerData.shared_count ?? 0);
        setReturnedFromBackCount(officerData.returned_from_back_count ?? 0);
        setNotificationCount(officerData.unread_count ?? 0);
      } catch {
        if (!mounted) return;

        setNotifications([]);
        setAppointmentCount(0);
        setPaymentCount(0);
        setNewApplicationCount(0);
        setSharedCount(0);
        setReturnedFromBackCount(0);
        setNotificationCount(0);
      } finally {
        if (mounted) setLoadingNotifications(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [isCustomer, isOfficer, pathname, role]);

  async function logout() {
    await authService.logout();
    toast.success("Logged out successfully");
    router.replace("/login");
  }

  function openNotification(item: CustomerNotificationItem | OfficerNotificationItem) {
    router.push(item.href || `/dashboard/officer/applications/${item.application_id}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        <div>
          <p className="text-xs text-muted-foreground">Current workspace</p>
          <h2 className="text-sm font-semibold md:text-base">{dashboard.roleName}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(isCustomer || isOfficer) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-0">
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span>Notifications</span>
                <Badge variant="secondary">{notificationCount}</Badge>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {isCustomer ? (
                <div className="grid grid-cols-2 gap-2 px-4 py-3">
                  <div className="rounded-xl border bg-blue-50 p-3">
                    <p className="text-xs text-muted-foreground">Appointments</p>
                    <p className="text-xl font-bold text-blue-700">{appointmentCount}</p>
                  </div>
                  <div className="rounded-xl border bg-emerald-50 p-3">
                    <p className="text-xs text-muted-foreground">Payments</p>
                    <p className="text-xl font-bold text-emerald-700">{paymentCount}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 px-4 py-3">
                  <div className="rounded-xl border bg-blue-50 p-3">
                    <p className="text-xs text-muted-foreground">New</p>
                    <p className="text-xl font-bold text-blue-700">{newApplicationCount}</p>
                  </div>
                  <div className="rounded-xl border bg-purple-50 p-3">
                    <p className="text-xs text-muted-foreground">Shared</p>
                    <p className="text-xl font-bold text-purple-700">{sharedCount}</p>
                  </div>
                  <div className="rounded-xl border bg-amber-50 p-3">
                    <p className="text-xs text-muted-foreground">Returned</p>
                    <p className="text-xl font-bold text-amber-700">{returnedFromBackCount}</p>
                  </div>
                </div>
              )}

              <DropdownMenuSeparator />

              <ScrollArea className="max-h-80">
                {loadingNotifications ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {isCustomer
                      ? "No appointment or payment messages."
                      : "No officer workflow notifications."}
                  </div>
                ) : (
                  notifications.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="cursor-pointer gap-3 px-4 py-3"
                      onClick={() => openNotification(item)}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        {notificationIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{item.tracking_number}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-3 rounded-full px-2 py-1.5 hover:bg-muted"
            >
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.profile_image_url ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback>{initials(user?.name ?? user?.email)}</AvatarFallback>
              </Avatar>

              <div className="hidden text-left sm:block">
                <p className="max-w-[150px] truncate text-sm font-semibold">{user?.name ?? "User"}</p>
                <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {user?.email ?? dashboard.roleName}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="truncate text-sm font-semibold">{user?.name ?? "User"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email ?? dashboard.roleName}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/profile")}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Setting
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
