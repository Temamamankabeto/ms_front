"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Headphones,
  Loader2,
  MessageSquareText,
  PanelsTopLeft,
  PlusCircle,
  SearchCheck,
  Users,
  XCircle,
} from "lucide-react";

import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import RoleBasedDashboard from "@/components/dashboard/RoleBasedDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardForRole } from "@/config/dashboard.config";
import { useCustomerApplications } from "@/hooks/customer/use-customer-applications";
import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard";
import { authService } from "@/services/auth/auth.service";

function numberValue(value: unknown) {
  return Number(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function titleCase(value?: string | null) {
  return String(value || "-").replaceAll("_", " ");
}

function getStatusColor(key: string) {
  const colors: Record<string, string> = {
    total: "bg-blue-50 text-blue-700",
    pending: "bg-amber-50 text-amber-700",
    submitted: "bg-sky-50 text-sky-700",
    under_review: "bg-indigo-50 text-indigo-700",
    appointed: "bg-cyan-50 text-cyan-700",
    approved: "bg-emerald-50 text-emerald-700",
    completed: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    shared: "bg-purple-50 text-purple-700",
    returned: "bg-orange-50 text-orange-700",
    escalated: "bg-rose-50 text-rose-700",
  };

  return colors[key] || "bg-muted text-muted-foreground";
}

const statusCards = [
  { key: "total", label: "Total", icon: FileText },
  { key: "pending", label: "Pending", icon: Clock3 },
  { key: "submitted", label: "Submitted", icon: FileText },
  { key: "under_review", label: "Under Review", icon: SearchCheck },
  { key: "appointed", label: "Appointed", icon: CalendarCheck2 },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "completed", label: "Completed", icon: BadgeCheck },
  { key: "rejected", label: "Rejected", icon: XCircle },
  { key: "shared", label: "Shared", icon: ArrowRight },
  { key: "returned", label: "Returned", icon: Clock3 },
  { key: "escalated", label: "Escalated", icon: ArrowRight },
];

export default function DashboardPage() {
  const storedUser = authService.getStoredUser();
  const storedRole = String(storedUser?.role ?? storedUser?.roles?.[0] ?? "").toLowerCase();
  const isStoredCustomer = storedRole.includes("customer");

  const { data, isLoading, error } = useDashboardOverview({
    enabled: !isStoredCustomer,
  });

  const { data: recentData, isLoading: recentLoading } = useCustomerApplications({
    page: 1,
  });

  if (!isStoredCustomer && isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isStoredCustomer && (error || !data)) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-red-600">
        Failed to load dashboard.
      </div>
    );
  }

  const profile = data?.profile ?? {
    id: Number(storedUser?.id ?? 0),
    name: storedUser?.name ?? "Customer",
    email: storedUser?.email ?? null,
    phone: storedUser?.phone ?? null,
    avatar_url: storedUser?.profile_image_url ?? storedUser?.photo_url ?? null,
    role: storedRole || "customer",
    role_label: "Customer",
    location_level: storedUser?.location_level ?? null,
    scope_label: "Customer",
    city: storedUser?.city?.name ?? null,
    subcity: storedUser?.subcity?.name ?? null,
    woreda: storedUser?.woreda?.name ?? null,
  };

  const dashboard = getDashboardForRole(profile.role);
  const Icon = dashboard.icon;
  const status = data?.status_counts || recentData?.meta?.status_counts || {};
  const modules = data?.module_counts || {};
  const isCustomer = String(profile.role).toLowerCase().includes("customer");

  if (!isCustomer) {
    return <RoleBasedDashboard />;
  }

  const customerStatusCards = [
    {
      label: "Total Application",
      value: numberValue(status.total),
      href: "/dashboard/my-applications",
      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending",
      value: numberValue(status.pending),
      href: "/dashboard/my-applications?status=pending",
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Rejected",
      value: numberValue(status.rejected),
      href: "/dashboard/my-applications?status=rejected",
      className: "bg-red-50 text-red-700",
    },
    {
      label: "Approved",
      value: numberValue(status.approved),
      href: "/dashboard/my-applications?status=approved",
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Appointed",
      value: numberValue(status.appointed),
      href: "/dashboard/my-applications?status=appointed",
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Completed",
      value: numberValue(status.completed),
      href: "/dashboard/my-applications?status=completed",
      className: "bg-green-50 text-green-700",
    },
  ];

  const recentApplications = (recentData?.data || []).slice(0, 8);

  function customerActionLinks(application: any) {
    const normalizedStatus = String(application.status || "").toLowerCase();
    const items = [
      {
        label: "View",
        href: `/dashboard/my-applications/${application.id}`,
      },
      {
        label: "Track",
        href: `/dashboard/track-application?tracking=${application.tracking_number}`,
      },
    ];

    if (normalizedStatus.includes("completed") || normalizedStatus.includes("approved")) {
      items.push({
        label: "Download",
        href: `/dashboard/my-applications/${application.id}`,
      });
    }

    if (normalizedStatus.includes("payment")) {
      items.push({
        label: "Pay",
        href: `/dashboard/payments?application_id=${application.id}`,
      });
    }

    if (normalizedStatus.includes("returned")) {
      items.push({
        label: "Resubmitted",
        href: `/dashboard/my-applications/${application.id}/edit`,
      });
    }

    return items;
  }

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[2rem] border bg-cover bg-center p-6 text-white shadow-sm md:p-8"
        style={{ backgroundImage: "url('/images/adama-clear-city-night.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-blue-950/20" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/75">City Building</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Welcome back, {profile.name}! 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Track your applications, follow office decisions, and access your
              municipal services from one secure dashboard.
            </p>
            <div className="mt-5 inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              Main Dashboard
            </div>
          </div>

          <Button asChild className="rounded-2xl bg-white text-blue-950 hover:bg-white/90">
            <Link href="/services">
              New Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {customerStatusCards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <Card className="rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4">
                <div className={`mb-3 inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${card.className}`}>
                  {card.label}
                </div>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="rounded-[2rem] shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Main Dashboard</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recent applications with view, track, payment, resubmission, and download actions.
            </p>
          </div>

          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/dashboard/my-applications">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : recentApplications.length ? (
                  recentApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.tracking_number || `APP-${application.id}`}
                      </TableCell>
                      <TableCell>{formatDate(application.submitted_at)}</TableCell>
                      <TableCell>
                        <ApplicationStatusBadge status={application.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1 text-sm">
                          {customerActionLinks(application).map((item, index) => (
                            <span key={`${application.id}-${item.label}`} className="inline-flex items-center">
                              {index > 0 && <span className="mx-1 text-muted-foreground">|</span>}
                              <Link href={item.href} className="font-medium text-primary hover:underline">
                                {item.label}
                              </Link>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No recent applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}