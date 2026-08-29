"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ApplicationFilesList from "@/components/application/ApplicationFilesList";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import ApplicationWorkflowTimeline from "@/components/application/ApplicationWorkflowTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServiceApplication } from "@/hooks/application-workflow/use-application-workflow";

export default function ServiceApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isLoading } = useServiceApplication(id);

  if (isLoading) return <div>Loading application...</div>;
  if (!data) return <div>Application not found.</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/dashboard/service-applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.tracking_number}</h1>
          <p className="text-sm text-muted-foreground">{data.service?.name}</p>
        </div>

        <ApplicationStatusBadge status={data.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-3xl xl:col-span-2">
          <CardHeader>
            <CardTitle>Submitted Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.data?.length ? (
              data.data.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-2xl border p-4 md:grid-cols-3">
                  <div className="font-medium">{item.field_name}</div>
                  <div className="text-muted-foreground md:col-span-2">{item.field_value || "-"}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data submitted.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Applicant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {data.customer?.name || data.customer_id}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {data.customer?.email || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Submitted:</span>{" "}
              {data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationFilesList files={data.files} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationWorkflowTimeline workflow={data.workflow} histories={data.histories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
