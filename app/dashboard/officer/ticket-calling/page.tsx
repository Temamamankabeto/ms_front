"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Play, RefreshCw, Pause, SkipForward } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Ticket = {
  id: number;
  ticket_number: string;
  service_id: number;
  service_name: string | null;
  service_application_id: number | null;
  window_id: number;
  status: "waiting" | "called" | "serving";
  calling_officer_id: number | null;
  administrative_level: string;
};
type WindowState = { window_id: number; is_paused: boolean };
type Queue = { tickets: Ticket[]; windows: WindowState[] };
type ApiResponse<T> = { success: boolean; message: string; data: T; meta?: unknown };
type Operation =
  | { type: "ticket"; id: number; action: "call" | "recall" | "start" }
  | { type: "window"; windowId: number; action: "call-next" | "pause" | "resume" };

export default function OfficerTicketCallingPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const queue = useQuery({
    queryKey: ["officer-ticket-calling-queue"],
    queryFn: async () => (await api.get<ApiResponse<Queue>>("/officer/tickets/queue")).data.data,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const mutation = useMutation({
    mutationFn: async (operation: Operation) => {
      const path = operation.type === "ticket"
        ? `/officer/tickets/${operation.id}/${operation.action}`
        : `/officer/tickets/${operation.action}`;
      const payload = operation.type === "window" ? { window_id: operation.windowId } : {};
      return (await api.post<ApiResponse<unknown>>(path, payload)).data;
    },
    onMutate: () => { setError(""); setMessage(""); },
    onSuccess: async result => {
      setMessage(result.message);
      await client.invalidateQueries({ queryKey: ["officer-ticket-calling-queue"] });
    },
    onError: (cause: unknown) => {
      const e = cause as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Unable to update ticket.");
    },
  });
  const tickets = queue.data?.tickets ?? [];
  const windows = queue.data?.windows ?? [];
  const counts = useMemo(() => ({
    waiting: tickets.filter(t => t.status === "waiting").length,
    called: tickets.filter(t => t.status === "called").length,
    serving: tickets.filter(t => t.status === "serving").length,
  }), [tickets]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Officer Ticket Calling</h1><p className="text-sm text-muted-foreground">Tickets from your assigned windows and administrative location.</p></div>
        <Button variant="outline" onClick={() => void queue.refetch()} disabled={queue.isFetching}><RefreshCw className="mr-2 size-4"/> Refresh</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["waiting", "called", "serving"] as const).map(status => <Card key={status}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium capitalize">{status}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{counts[status]}</CardContent></Card>)}
      </div>
      {error && <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-md border p-3 text-sm">{message}</p>}
      {queue.isLoading ? <p className="flex items-center gap-2"><Loader2 className="size-4 animate-spin"/> Loading assigned tickets…</p>
      : queue.isError ? <p role="alert" className="text-destructive">Unable to load your queue. Check your session and permissions.</p>
      : windows.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No assigned windows.</CardContent></Card>
      : <div className="space-y-6">{windows.map(window => {
        const windowTickets = tickets.filter(ticket => ticket.window_id === window.window_id);
        const current = windowTickets.find(ticket => ticket.status === "serving" || ticket.status === "called");
        const waiting = windowTickets.some(ticket => ticket.status === "waiting");
        return <section key={window.window_id} className="space-y-3" aria-label={`Window ${window.window_id}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div><h2 className="font-semibold">Window {window.window_id}</h2><p className="text-xs text-muted-foreground">{window.is_paused ? "Queue paused" : "Queue active"}</p></div>
            <div className="flex flex-wrap gap-2">
              {window.is_paused ? <Button disabled={mutation.isPending} onClick={() => mutation.mutate({ type: "window", windowId: window.window_id, action: "resume" })}>Resume Queue</Button>
              : <>
                <Button disabled={mutation.isPending || (!waiting && !current) || current?.status === "called"} onClick={() => mutation.mutate({ type: "window", windowId: window.window_id, action: "call-next" })}><SkipForward className="mr-2 size-4"/> Call Next</Button>
                <Button variant="outline" disabled={mutation.isPending || current?.status === "called"} onClick={() => mutation.mutate({ type: "window", windowId: window.window_id, action: "pause" })}><Pause className="mr-2 size-4"/> Pause Queue</Button>
              </>}
            </div>
          </div>
          {windowTickets.length === 0 ? <p className="text-sm text-muted-foreground">No active or waiting tickets for this window.</p>
          : <div className="grid gap-4 lg:grid-cols-2">{windowTickets.map(ticket => <Card key={ticket.id}>
            <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{ticket.ticket_number}</CardTitle><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">{ticket.status}</span></div></CardHeader>
            <CardContent className="space-y-4"><div className="text-sm text-muted-foreground">{ticket.service_name || `Service ${ticket.service_id}`} · Window {ticket.window_id} · {ticket.administrative_level}</div>
              <div className="flex flex-wrap gap-2">
                {ticket.status === "waiting" && <Button disabled={mutation.isPending || window.is_paused || !!current} onClick={() => mutation.mutate({ type: "ticket", id: ticket.id, action: "call" })}><Megaphone className="mr-2 size-4"/> Call Ticket</Button>}
                {ticket.status === "called" && <><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ type: "ticket", id: ticket.id, action: "recall" })}><Megaphone className="mr-2 size-4"/> Recall</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate({ type: "ticket", id: ticket.id, action: "start" })}><Play className="mr-2 size-4"/> Start Serving</Button></>}
                {ticket.status === "serving" && <span className="text-sm text-muted-foreground">Ticket remains serving until Call Next or Pause Queue. Continue the MESOB application workflow independently.</span>}
                {ticket.service_application_id && <Button variant="outline" asChild><Link href={`/dashboard/officer/applications/${ticket.service_application_id}`}>Officer Applications</Link></Button>}
              </div>
            </CardContent>
          </Card>)}</div>}
        </section>;
      })}</div>}
    </main>
  );
}
