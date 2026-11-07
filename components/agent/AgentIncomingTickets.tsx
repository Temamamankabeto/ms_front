"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IncomingTicket = { ticket_number: string; service_id: number; service_name: string; officer_code: string | null; status: string };

export default function AgentIncomingTickets() {
  const [tickets, setTickets] = useState<IncomingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const filteredTickets = useMemo(() => tickets.filter((ticket) =>
    ticket.ticket_number.toLowerCase().includes(ticketSearch.trim().toLowerCase())
  ), [tickets, ticketSearch]);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/agent/tickets/incoming");
      setTickets(Array.isArray(response.data?.data) ? response.data.data : []);
      setError("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Unable to load incoming tickets.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-2 md:p-6">
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">Incoming Tickets</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tickets for your assigned windows. Open the selected service application form.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Incoming Tickets ({tickets.length})</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label htmlFor="agent-ticket-search" className="sr-only">Search by ticket number</label>
            <Input
              id="agent-ticket-search"
              type="search"
              autoComplete="off"
              placeholder="Search ticket number..."
              value={ticketSearch}
              onChange={(event) => setTicketSearch(event.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/60"><tr className="border-b">
                <th scope="col" className="px-4 py-3 font-semibold">Ticket Number</th>
                <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                <th scope="col" className="px-4 py-3 font-semibold">Officer Code</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
              </tr></thead>
              <tbody>
                {!error && !loading && tickets.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No incoming tickets for your assigned windows.</td></tr>}
                {loading && tickets.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading tickets…</td></tr>}
                {!error && !loading && tickets.length > 0 && filteredTickets.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tickets match that ticket number.</td></tr>}
                {filteredTickets.map(item => <tr key={item.ticket_number} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{item.ticket_number}</td>
                  <td className="px-4 py-3">{item.service_name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{item.officer_code || "Not assigned"}</td>
                  <td className="px-4 py-3 capitalize">{item.status}</td>
                  <td className="px-4 py-3 text-right"><Button asChild size="sm" variant="outline" disabled={!Number.isInteger(Number(item.service_id)) || Number(item.service_id) <= 0}><Link href={`/services/${encodeURIComponent(String(item.service_id))}/apply?ticket_number=${encodeURIComponent(item.ticket_number)}`}>Process Application</Link></Button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
