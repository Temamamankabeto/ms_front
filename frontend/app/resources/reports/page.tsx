"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  MapPinned,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";

import api, { unwrap } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportItem {
  name: string;
  total: number;
}

interface ReportDashboardData {
  summary: {
    total_services: number;
    active_services: number;
    total_applications: number;
    approved_applications: number;
    completed_applications: number;
    pending_applications: number;
    rejected_applications: number;
    total_cities: number;
    total_subcities: number;
    total_woredas: number;
    total_revenue: number;
  };
  applications_by_status: Record<string, number>;
  applications_by_service: ReportItem[];
  applications_by_subcity: ReportItem[];
  applications_by_woreda: ReportItem[];
}

interface ReportDashboardResponse {
  success: boolean;
  message: string;
  data: ReportDashboardData;
  meta: null;
}

const configuredPowerBiUrl = process.env.NEXT_PUBLIC_POWER_BI_REPORT_URL?.trim() ?? "";
const powerBiUrl =
  configuredPowerBiUrl && !configuredPowerBiUrl.includes("YOUR_REPORT_ID")
    ? configuredPowerBiUrl
    : "";

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<ReportDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await api.get("/public/reports/dashboard");
        const payload = unwrap<ReportDashboardResponse>(response);

        if (mounted) {
          setDashboard(payload.data);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Unable to load live report data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = dashboard?.summary;

  const stats = useMemo(
    () => [
      { title: "Total Services", value: summary?.total_services ?? 0, icon: FileText, tone: "blue" },
      { title: "Active Services", value: summary?.active_services ?? 0, icon: CheckCircle2, tone: "emerald" },
      { title: "Total Applications", value: summary?.total_applications ?? 0, icon: BarChart3, tone: "indigo" },
      { title: "Pending Applications", value: summary?.pending_applications ?? 0, icon: Clock3, tone: "amber" },
      { title: "Approved / Completed", value: (summary?.approved_applications ?? 0) + (summary?.completed_applications ?? 0), icon: TrendingUp, tone: "emerald" },
      { title: "Rejected Applications", value: summary?.rejected_applications ?? 0, icon: XCircle, tone: "rose" },
      { title: "City / Subcity / Woreda", value: `${summary?.total_cities ?? 0}/${summary?.total_subcities ?? 0}/${summary?.total_woredas ?? 0}`, icon: MapPinned, tone: "sky" },
      { title: "Revenue Collected", value: `${Number(summary?.total_revenue ?? 0).toLocaleString()} ETB`, icon: WalletCards, tone: "green" },
    ],
    [summary]
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#06295a] via-[#0758a8] to-[#059669] p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="bg-white/15 text-white hover:bg-white/20">Official Public Report</Badge>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">Adama MESOB General Reports</h1>
              <p className="mt-4 max-w-3xl text-white/85">
                Live service delivery statistics and Power BI analytics for city, subcity, woreda, application, workflow, and revenue performance.
              </p>
            </div>
            <div className="rounded-3xl bg-white/15 p-6 backdrop-blur">
              <BarChart3 className="h-20 w-20 text-emerald-200" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <ReportStat key={stat.title} {...stat} loading={loading} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ReportList title="Top Requested Services" icon={Building2} items={dashboard?.applications_by_service ?? []} loading={loading} />
          <ReportList title="Applications by Subcity" icon={Landmark} items={dashboard?.applications_by_subcity ?? []} loading={loading} />
          <ReportList title="Applications by Woreda" icon={MapPinned} items={dashboard?.applications_by_woreda ?? []} loading={loading} />
        </div>

        <section className="space-y-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Power BI Dashboard</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                View the published Microsoft Power BI report for full visual analytics.
              </p>
            </div>
            {powerBiUrl ? (
              <Button asChild>
                <a href={powerBiUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open in Power BI
                </a>
              </Button>
            ) : null}
          </div>

          {powerBiUrl ? (
            <iframe
              title="Adama MESOB Power BI Report"
              src={powerBiUrl}
              className="h-[760px] w-full rounded-xl border bg-background"
              allowFullScreen
            />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center border-y border-dashed bg-background text-center">
              <div className="max-w-lg px-6 py-12">
                <BarChart3 className="mx-auto h-16 w-16 text-primary" />
                <h3 className="mt-4 text-2xl font-black">Power BI URL is not configured</h3>
                <p className="mt-2 text-muted-foreground">
                  Replace <strong>YOUR_REPORT_ID</strong> with the real published report ID in the frontend environment, then rebuild and redeploy.
                </p>
                <code className="mt-4 block overflow-x-auto rounded-lg bg-muted p-4 text-left text-sm text-foreground">
                  NEXT_PUBLIC_POWER_BI_REPORT_URL=https://app.powerbi.com/view?r=YOUR_REPORT_ID
                </code>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ReportStat({ title, value, icon: Icon, loading }: { title: string; value: number | string; icon: typeof BarChart3; tone: string; loading: boolean }) {
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex items-center gap-4 p-6">
        <span className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-1 text-2xl font-black">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportList({ title, icon: Icon, items, loading }: { title: string; icon: typeof BarChart3; items: ReportItem[]; loading: boolean }) {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card className="rounded-3xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-black">
          <span className="rounded-2xl bg-blue-100 p-3 text-blue-700"><Icon className="h-6 w-6" /></span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#063d91]" /></div>
        ) : items.length ? (
          items.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-bold">{item.name}</span>
                <span className="font-black text-[#063d91]">{item.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#063d91]" style={{ width: `${Math.max((item.total / max) * 100, 8)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No data available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
