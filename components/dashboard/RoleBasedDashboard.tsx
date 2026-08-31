"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Smile,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOverview } from "@/hooks/dashboard/use-dashboard";
import { useReportingDashboardCards } from "@/hooks/dashboard/use-reporting-dashboard";

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{Number(value || 0)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function numberValue(value: unknown) {
  return Number(value || 0);
}

function readableRole(value?: string | null) {
  return String(value || "Dashboard")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RoleOverviewDashboard({ data }: { data: any }) {
  const statusCounts = data?.status_counts || {};
  const cards = Array.isArray(data?.cards) ? data.cards : [];
  const profile = data?.profile || {};
  const roleDashboard = data?.role_dashboard;

  const total =
    statusCounts.total ??
    cards.find((card: any) => String(card.key).includes("total"))?.value ??
    0;

  const onProgress =
    statusCounts.pending ??
    statusCounts.submitted ??
    statusCounts.in_progress ??
    statusCounts.under_review ??
    cards.find((card: any) => String(card.key).includes("pending"))?.value ??
    0;

  const completed =
    statusCounts.completed ??
    statusCounts.approved ??
    cards.find((card: any) => String(card.key).includes("completed"))?.value ??
    0;

  const rejected = statusCounts.rejected ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {roleDashboard?.title || readableRole(profile.role_label || profile.role)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {roleDashboard?.description ||
                profile.scope_label ||
                "Dashboard overview"}
            </p>
          </div>

          {roleDashboard?.primary_action?.href ? (
            <Button asChild>
              <Link href={roleDashboard.primary_action.href}>
                {roleDashboard.primary_action.label || "Open"}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/officer-applications">
                Open Applications
              </Link>
            </Button>
          )}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-4">
          <MetricCard title="Total Application" value={total} icon={FileText} />
          <MetricCard title="Onprogress Application" value={onProgress} icon={Clock3} />
          <MetricCard title="Completed Application" value={completed} icon={CheckCircle2} />
          <MetricCard title="Rejected Application" value={rejected} icon={AlertCircle} />
        </CardContent>
      </Card>

      {roleDashboard?.sections?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {roleDashboard.sections.map((section: any) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {(section.items || []).map((item: any) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border p-4"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-lg font-semibold">
                      {item.value ?? 0}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RoleBasedDashboard() {
  const reportingQuery = useReportingDashboardCards();
  const overviewQuery = useDashboardOverview();

  const reportingData = reportingQuery.data;
  const overviewData = overviewQuery.data;

  if (reportingQuery.isLoading && overviewQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reportingData) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {reportingData.scope.label}
              </p>
            </div>

            <Button asChild>
              <Link href="/dashboard/reports">Open Report Page</Link>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Service</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Total Application"
              value={reportingData.service_cards.total_applications}
              icon={FileText}
            />

            <MetricCard
              title="Onprogress Application"
              value={reportingData.service_cards.on_progress_applications}
              icon={Clock3}
            />

            <MetricCard
              title="Completed Application"
              value={reportingData.service_cards.completed_applications}
              icon={CheckCircle2}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed Back</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Highly Satisfied"
              value={reportingData.feedback_cards.highly_satisfied}
              icon={Smile}
            />

            <MetricCard
              title="Satisfied"
              value={reportingData.feedback_cards.satisfied}
              icon={ThumbsUp}
            />

            <MetricCard
              title="Dissatisfied"
              value={reportingData.feedback_cards.dissatisfied}
              icon={MessageCircle}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (overviewData) {
    return <RoleOverviewDashboard data={overviewData} />;
  }

  return (
    <RoleOverviewDashboard
      data={{
        profile: {
          role: "officer",
          role_label: "Officer Dashboard",
          scope_label: "Application workspace",
        },
        status_counts: {},
      }}
    />
  );
}
