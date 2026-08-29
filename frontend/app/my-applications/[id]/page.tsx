"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplication } from "@/hooks/application-workflow/use-application-workflow";

export default function MyApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isLoading } = useApplication(id);

  if (isLoading) return <div className="p-6">Loading application...</div>;
  if (!data) return <div className="p-6">Application not found.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Button asChild variant="outline">
        <Link href="/my-applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
<h1 className="text-2xl font-bold">
  {data.tracking_number}
</h1>          <p className="text-sm text-muted-foreground">{data.service?.name}</p>
        </div>

        <ApplicationStatusBadge status={data.status} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-medium">{data.service?.name || data.service_id}</p>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <ApplicationStatusBadge status={data.status} />
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="font-medium">{data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "-"}</p>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-medium">{data.completed_at ? new Date(data.completed_at).toLocaleString() : "-"}</p>
          </div>

          <div className="rounded-2xl border p-4 md:col-span-2">
            <p className="text-sm text-muted-foreground">Remarks</p>
            <p className="font-medium">
  {data.rejection_reason || "-"}
</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
