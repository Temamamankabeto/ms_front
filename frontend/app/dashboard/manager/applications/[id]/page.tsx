"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import ApplicationFilesList from "@/components/application/ApplicationFilesList";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import ApplicationWorkflowTimeline from "@/components/application/ApplicationWorkflowTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useManagerApplication,
  useManagerApplicationAction,
  useOfficerSharingOfficers,
  useOfficerSharingWindows,
} from "@/hooks/application-workflow/use-application-workflow";

export default function ManagerApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isLoading } = useManagerApplication(id);
  const action = useManagerApplicationAction(id);

  const [note, setNote] = useState("");
  const [windowId, setWindowId] = useState<number | undefined>();
  const [officerId, setOfficerId] = useState<number | undefined>();

  const { data: windows = [] } = useOfficerSharingWindows();
  const { data: officers = [] } = useOfficerSharingOfficers(windowId);

  async function run(nextAction: "assign-officer" | "return-to-officer" | "escalate-up") {
    if (nextAction === "assign-officer" && (!windowId || !officerId)) {
      toast.error("Select window and officer");
      return;
    }

    try {
      await action.mutateAsync({ action: nextAction, payload: { note, remark: note, window_id: windowId, officer_id: officerId } });
      toast.success("Action completed");
      setNote("");
      setWindowId(undefined);
      setOfficerId(undefined);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Action failed");
    }
  }

  if (isLoading) return <div>Loading case...</div>;
  if (!data) return <div>Case not found.</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline"><Link href="/dashboard/manager/applications"><ArrowLeft className="mr-2 h-4 w-4" />Back to Manager Queue</Link></Button>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{data.tracking_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{data.service?.name} · {data.customer?.name || data.customer_id}</p>
            <p className="mt-1 text-xs text-muted-foreground">Level: {data.administrative_level || "-"} · Window: {data.current_window?.name || data.current_window_id || "-"}</p>
          </div>
          <ApplicationStatusBadge status={data.status} />
        </div>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Manager Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notes / description" />

          <div className="grid gap-3 md:grid-cols-2">
            <select className="rounded-md border p-2" value={windowId || ""} onChange={(e) => setWindowId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">Select window</option>
              {windows.map((window) => <option key={window.id} value={window.id}>{window.name}</option>)}
            </select>

            <select className="rounded-md border p-2" value={officerId || ""} onChange={(e) => setOfficerId(e.target.value ? Number(e.target.value) : undefined)} disabled={!windowId}>
              <option value="">Select officer</option>
              {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run("assign-officer")} disabled={action.isPending}>Assign Officer</Button>
            <Button variant="outline" onClick={() => run("return-to-officer")} disabled={action.isPending}>Return to Officer</Button>
            <Button variant="outline" onClick={() => run("escalate-up")} disabled={action.isPending}>Escalate Up</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl"><CardHeader><CardTitle>Files</CardTitle></CardHeader><CardContent><ApplicationFilesList files={data.files} /></CardContent></Card>
        <Card className="rounded-3xl"><CardHeader><CardTitle>Workflow History</CardTitle></CardHeader><CardContent><ApplicationWorkflowTimeline workflow={data.workflow} histories={data.histories} /></CardContent></Card>
      </div>
    </div>
  );
}
