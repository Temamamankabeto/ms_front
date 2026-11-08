"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RefreshCw } from "lucide-react";

type Summary = { total: number; submitted: number; completed: number; rejected: number; other: number; agents: number };
type Agent = { agent_id: number; agent_name: string; total: number; submitted: number; completed: number; rejected: number };
type Window = { window_id: number; total: number };
type RecordRow = { id: number; agent_name: string; ticket_number: string; window_id: number; tracking_number: string; application_status: string; administrative_level: string; city_id: number | null; subcity_id: number | null; woreda_id: number | null; processed_at: string };
type Report = { success: boolean; message: string; data: { scope: { level: string; city_id: number | null; subcity_id: number | null; woreda_id: number | null }; summary: Summary; by_agent: Agent[]; by_window: Window[]; records: RecordRow[] }; meta: { current_page: number; last_page: number; total: number } };

export default function ConsolidatedAgentReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [level, setLevel] = useState("");
  const [city, setCity] = useState("");
  const [subcity, setSubcity] = useState("");
  const [woreda, setWoreda] = useState("");
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const invalidDates = Boolean(from && to && from > to);
  const params = { ...(from && { from }), ...(to && { to }), ...(level && { administrative_level: level }), ...(city && { city_id: city }), ...(subcity && { subcity_id: subcity }), ...(woreda && { woreda_id: woreda }), ...(agent && { agent_id: agent }), ...(status && { status }) };
  const reportQuery = useQuery({ queryKey: ["admin", "agent-report", params, page], queryFn: async () => (await api.get<Report>("/admin/agent-reports", { params: { ...params, page } })).data, enabled: !invalidDates });
  const report = reportQuery.data?.data;
  const scope = report?.scope;
  const setFilter = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setter(event.target.value); setPage(1); };
  async function exportCsv() {
    setExportError(""); setExporting(true);
    try {
      const response = await api.get<Blob>("/admin/agent-reports/export", { params, responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a"); link.href = url; link.download = "mesob-consolidated-agent-report.csv";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch { setExportError("Export failed. Verify your access and try again."); }
    finally { setExporting(false); }
  }
  return <main className="mx-auto max-w-7xl space-y-5 p-3 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">MESOB eService · Administration</p><h1 className="text-2xl font-semibold">Consolidated Agent Report</h1><p className="text-sm text-muted-foreground">Application activity restricted to your authorized administrative locations.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => void reportQuery.refetch()} disabled={reportQuery.isFetching || invalidDates}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button><Button onClick={() => void exportCsv()} disabled={exporting || invalidDates || !report?.summary.total}><Download className="mr-2 h-4 w-4"/>{exporting ? "Exporting…" : "Export CSV"}</Button></div>
    </header>
    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">From date<input aria-label="From date" type="date" className="mt-1 block w-full rounded-md border bg-background p-2" value={from} onChange={setFilter(setFrom)}/></label>
      <label className="text-sm">To date<input aria-label="To date" type="date" className="mt-1 block w-full rounded-md border bg-background p-2" value={to} onChange={setFilter(setTo)}/></label>
      <label className="text-sm">Administrative level<select className="mt-1 block w-full rounded-md border bg-background p-2" value={level} onChange={setFilter(setLevel)}><option value="">All permitted levels</option>{["city", "subcity", "woreda"].map(x => <option key={x} value={x}>{x}</option>)}</select></label>
      <label className="text-sm">Application status<select className="mt-1 block w-full rounded-md border bg-background p-2" value={status} onChange={setFilter(setStatus)}><option value="">All statuses</option>{["draft", "submitted", "under_review", "returned", "approved", "rejected", "completed"].map(x => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}</select></label>
      {([ ["City ID", city, setCity], ["Subcity ID", subcity, setSubcity], ["Woreda ID", woreda, setWoreda], ["Agent ID", agent, setAgent] ] as const).map(([label, value, setter]) => <label className="text-sm" key={label}>{label}<input type="number" min="1" placeholder="All permitted" className="mt-1 block w-full rounded-md border bg-background p-2" value={value} onChange={setFilter(setter)}/></label>)}
    </CardContent></Card>
    {invalidDates && <p role="alert" className="text-sm text-destructive">To date must be on or after from date.</p>}
    {reportQuery.isError && <p role="alert" className="text-sm text-destructive">Unable to load report. Verify your administrator access.</p>}
    {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
    {scope && <p className="text-sm text-muted-foreground">Authorized scope: {scope.level} · City {scope.city_id ?? "All"} · Subcity {scope.subcity_id ?? "All"} · Woreda {scope.woreda_id ?? "All"}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{([ ["Applications processed", "total"], ["Active agents", "agents"], ["Submitted", "submitted"], ["Completed", "completed"], ["Rejected", "rejected"], ["Other statuses", "other"] ] as const).map(([label, key]) => <Card key={key}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{report?.summary[key] ?? "—"}</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Performance by agent</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{["Agent", "Processed", "Submitted", "Completed", "Rejected"].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{report?.by_agent.map(x => <tr key={x.agent_id} className="border-b"><td className="p-3">{x.agent_name}</td><td className="p-3">{x.total}</td><td className="p-3">{x.submitted}</td><td className="p-3">{x.completed}</td><td className="p-3">{x.rejected}</td></tr>)}</tbody></table>{report?.by_agent.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching agent activity.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Applications by window</CardTitle></CardHeader><CardContent className="space-y-3">{report?.by_window.map(w => <div key={w.window_id} className="flex items-center gap-3 text-sm"><span className="w-24">Window {w.window_id}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${report.summary.total ? w.total / report.summary.total * 100 : 0}%` }}/></div><span className="w-12 text-right tabular-nums">{w.total}</span></div>)}{report?.by_window.length === 0 && <p className="text-sm text-muted-foreground">No window activity.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Application details</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{["Processed at", "Agent", "Ticket", "Window", "Tracking", "Status", "Level", "Location IDs"].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{report?.records.map(r => <tr key={r.id} className="border-b"><td className="whitespace-nowrap p-3">{r.processed_at}</td><td className="p-3">{r.agent_name}</td><td className="p-3">{r.ticket_number}</td><td className="p-3">{r.window_id}</td><td className="p-3">{r.tracking_number}</td><td className="p-3">{r.application_status}</td><td className="p-3">{r.administrative_level}</td><td className="whitespace-nowrap p-3">{[r.city_id, r.subcity_id, r.woreda_id].filter(x => x != null).join(" / ")}</td></tr>)}</tbody></table>{report?.records.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching applications.</p>}</CardContent></Card>
    {reportQuery.data && <div className="flex items-center justify-between text-sm"><span>Page {reportQuery.data.meta.current_page} of {reportQuery.data.meta.last_page} · {reportQuery.data.meta.total} records</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button variant="outline" disabled={page >= reportQuery.data.meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button></div></div>}
  </main>;
}
