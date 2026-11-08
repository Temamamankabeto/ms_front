"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RefreshCw } from "lucide-react";

type RecordRow = {
  id: number;
  processed_at: string;
  ticket_number: string;
  service_name: string;
  window_id: number;
  ticket_status: string;
  application_id: number;
  tracking_number: string;
  application_status: string;
};
type Report = {
  success: boolean;
  message: string;
  data: {
    summary: { total: number; submitted: number; completed: number; rejected: number; other: number };
    records: RecordRow[];
  };
  meta: { current_page: number; last_page: number; total: number; per_page: number };
};

export default function AgentReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const invalidDates = Boolean(from && to && from > to);
  const filters = { ...(from ? { from } : {}), ...(to ? { to } : {}), ...(status ? { status } : {}) };
  const query = useQuery({
    queryKey: ["agent", "my-report", from, to, status, page],
    queryFn: async () => (await api.get<Report>("/agent/reports/me", { params: { ...filters, page } })).data,
    enabled: !invalidDates,
  });
  const report = query.data;

  async function downloadCsv() {
    setExporting(true);
    setExportError("");
    try {
      const response = await api.get<Blob>("/agent/reports/me/export", { params: filters, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mesob-my-agent-report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Unable to export the report. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const summary = report?.data.summary;
  const cards = [
    { label: "Applications Processed", value: summary?.total },
    { label: "Currently Submitted", value: summary?.submitted },
    { label: "Completed", value: summary?.completed },
    { label: "Rejected", value: summary?.rejected },
    { label: "Other Statuses", value: summary?.other },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-3 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">MESOB eService · Agent Workspace</p>
          <h1 className="text-2xl font-semibold">My Agent Report</h1>
          <p className="text-sm text-muted-foreground">Applications submitted by your account. Statuses reflect their current state.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching || invalidDates}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => void downloadCsv()} disabled={exporting || invalidDates || !report?.data.summary.total}>
            <Download className="mr-2 h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </header>
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">From date
            <input type="date" className="block w-full rounded-md border bg-background p-2" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
          </label>
          <label className="space-y-1 text-sm">To date
            <input type="date" className="block w-full rounded-md border bg-background p-2" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
          </label>
          <label className="space-y-1 text-sm">Application status
            <select className="block w-full rounded-md border bg-background p-2" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {['draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected', 'completed'].map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
        </CardContent>
      </Card>
      {invalidDates && <p role="alert" className="text-sm text-destructive">The end date must not be before the start date.</p>}
      {query.isError && <p role="alert" className="text-sm text-destructive">Unable to load your agent report. Check your session and try again.</p>}
      {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
      <section aria-label="My report summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(card => <Card key={card.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{query.isLoading ? "…" : (card.value ?? "—").toLocaleString()}</p></CardContent></Card>)}
      </section>
      <Card>
        <CardHeader><CardTitle>Application Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead><tr className="border-b text-muted-foreground"><th className="p-3">Processed at</th><th className="p-3">Ticket</th><th className="p-3">Service</th><th className="p-3">Window</th><th className="p-3">Tracking number</th><th className="p-3">Application status</th><th className="p-3">Ticket status</th></tr></thead>
              <tbody>
                {report?.data.records.map(row => <tr className="border-b" key={row.id}>
                  <td className="p-3 whitespace-nowrap">{row.processed_at}</td><td className="p-3">{row.ticket_number}</td>
                  <td className="p-3">{row.service_name}</td><td className="p-3">{row.window_id}</td>
                  <td className="p-3">{row.tracking_number}</td><td className="p-3 capitalize">{row.application_status.replaceAll('_', ' ')}</td>
                  <td className="p-3 capitalize">{row.ticket_status.replaceAll('_', ' ')}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {!query.isLoading && report?.data.records.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No applications match these filters.</p>}
          {query.isLoading && <p className="py-6 text-sm text-muted-foreground">Loading report…</p>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-sm">
            <span>{report ? `${report.meta.total} applications · Page ${report.meta.current_page} of ${report.meta.last_page}` : ""}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!report || page >= report.meta.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
