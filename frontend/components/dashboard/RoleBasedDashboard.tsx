"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, FileText, Loader2, MessageCircle, Smile, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportingDashboardCards } from "@/hooks/dashboard/use-reporting-dashboard";

function MetricCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card><CardContent className="flex items-center gap-4 p-5">
      <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
      <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-3xl font-bold">{Number(value || 0)}</p></div>
    </CardContent></Card>
  );
}

export default function RoleBasedDashboard() {
  const { data, isLoading, error } = useReportingDashboardCards();

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !data) return <div className="rounded-2xl border bg-card p-6 text-sm text-destructive">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-2 text-sm text-muted-foreground">{data.scope.label}</p></div>
          <Button asChild><Link href="/dashboard/reports">Open Report Page</Link></Button>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Service</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Total Application" value={data.service_cards.total_applications} icon={FileText} />
          <MetricCard title="Onprogress Application" value={data.service_cards.on_progress_applications} icon={Clock3} />
          <MetricCard title="Completed Application" value={data.service_cards.completed_applications} icon={CheckCircle2} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feed Back</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Highly Satisfied" value={data.feedback_cards.highly_satisfied} icon={Smile} />
          <MetricCard title="Satisfied" value={data.feedback_cards.satisfied} icon={ThumbsUp} />
          <MetricCard title="Dissatisfied" value={data.feedback_cards.dissatisfied} icon={MessageCircle} />
        </CardContent>
      </Card>
    </div>
  );
}
