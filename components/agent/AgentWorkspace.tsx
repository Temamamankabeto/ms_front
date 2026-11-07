"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Activity, Building2, CheckCircle2, Inbox, RefreshCw, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type WindowStats = {
  window_id: number;
  window_name: string;
  assignment_level: string;
  incoming: number;
};
type DashboardStats = {
  assigned_windows: number;
  incoming_tickets: number;
  processed_tickets: number;
  total_tickets: number;
  windows: WindowStats[];
};

const number = (value: number) => new Intl.NumberFormat().format(value);

export default function AgentWorkspace() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/agent/dashboard");
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || "Dashboard data is unavailable.");
      }
      setStats(response.data.data as DashboardStats);
      setError("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Unable to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const cards = [
    { label: "Total Tickets", value: stats?.total_tickets, icon: Ticket },
    { label: "Incoming Tickets", value: stats?.incoming_tickets, icon: Inbox },
    { label: "Processed Tickets", value: stats?.processed_tickets, icon: CheckCircle2 },
    { label: "Assigned Windows", value: stats?.assigned_windows, icon: Building2 },
  ];
  const maximum = Math.max(1, ...(stats?.windows.map((w) => w.incoming) ?? []));
  const total = stats?.total_tickets ?? 0;
  const incomingPercent = total ? ((stats?.incoming_tickets ?? 0) / total) * 100 : 0;
  const processedPercent = total ? ((stats?.processed_tickets ?? 0) / total) * 100 : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-3 md:p-6">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">MESOB eService · Agent Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Agent Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ticket activity across your assigned service windows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/dashboard/agent/incoming-tickets">View Incoming Tickets</Link></Button>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}
      <section aria-label="Agent ticket statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div><p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums" aria-busy={loading}>{value === undefined ? "—" : number(value)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" aria-hidden="true" /> Incoming Tickets by Window</CardTitle></CardHeader>
          <CardContent>
            {stats && stats.windows.length === 0 ? <p className="text-sm text-muted-foreground">No active windows assigned.</p> :
              <div className="space-y-5" aria-label="Incoming ticket counts per assigned window">
                {stats?.windows.map((window, index) => (
                  <div key={`${window.window_id}-${window.assignment_level}-${index}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 break-words font-medium">{window.window_name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{number(window.incoming)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${window.window_name}: ${window.incoming} incoming tickets`}>
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(window.incoming / maximum) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {loading && !stats && <p className="text-sm text-muted-foreground">Loading window statistics…</p>}
              </div>}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5" aria-hidden="true" /> Ticket Processing Overview</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex h-5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${stats?.incoming_tickets ?? 0} incoming and ${stats?.processed_tickets ?? 0} processed tickets`}>
              <div className="bg-primary" style={{ width: `${incomingPercent}%` }} />
              <div className="bg-emerald-600" style={{ width: `${processedPercent}%` }} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary" />Incoming</span><strong className="tabular-nums">{number(stats?.incoming_tickets ?? 0)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-emerald-600" />Processed by you</span><strong className="tabular-nums">{number(stats?.processed_tickets ?? 0)}</strong></div>
            </div>
            <p className="border-t pt-4 text-xs text-muted-foreground">Total = currently incoming tickets in your assigned windows + applications processed by your Agent account. Historical processed tickets remain counted.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
