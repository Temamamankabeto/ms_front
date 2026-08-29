"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Search } from "lucide-react";

import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useManagerApplicationQueue } from "@/hooks/application-workflow/use-application-workflow";

const buckets = [
  { key: "", label: "All" },
  { key: "new-escalated", label: "New Escalated Cases" },
  { key: "assigned", label: "Assigned Cases" },
  { key: "returned", label: "Returned Cases" },
  { key: "forwarded", label: "Forwarded Cases" },
  { key: "resolved", label: "Resolved Cases" },
  { key: "completed", label: "Completed Cases" },
];

export default function ManagerApplicationsPage() {
  const [bucket, setBucket] = useState("");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useManagerApplicationQueue({ bucket: bucket || undefined, search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Manager Cases</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review escalated cases, assign officers, return cases, and escalate upward.</p>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {buckets.map((item) => (
              <Button key={item.key || "all"} variant={bucket === item.key ? "default" : "outline"} className="whitespace-nowrap rounded-2xl" onClick={() => setBucket(item.key)}>
                {item.label}
              </Button>
            ))}
          </div>

          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tracking number, service, or customer..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>{data.length} Case(s)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : data.length ? (
            <div className="space-y-3">
              {data.map((application) => (
                <div key={application.id} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{application.tracking_number}</h3>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{application.service?.name || "Service"} · {application.customer?.name || "Customer"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Level: {application.administrative_level || "-"} · Window: {application.current_window?.name || application.current_window_id || "-"}</p>
                    </div>

                    <Button asChild size="sm" className="rounded-xl">
                      <Link href={`/dashboard/manager/applications/${application.id}`}><Eye className="mr-2 h-4 w-4" />Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="py-12 text-center text-muted-foreground">No cases found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
