"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import ApplicationFilesList from "@/components/application/ApplicationFilesList";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import ApplicationWorkflowTimeline from "@/components/application/ApplicationWorkflowTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

function extractApplication(response: any) {
  const body = response?.data ?? response;

  if (body?.data?.tracking_number || body?.data?.id) return body.data;
  if (body?.tracking_number || body?.id) return body;
  if (body?.data?.data?.tracking_number || body?.data?.data?.id) return body.data.data;

  return null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestAppointment(application: any) {
  if (Array.isArray(application?.appointments) && application.appointments.length) {
    return application.appointments[0];
  }

  if (application?.appointment_at) {
    return {
      appointment_at: application.appointment_at,
      location: application.appointment_location,
      message: application.appointment_message,
      status: application.appointment_status,
    };
  }

  return null;
}

function locationText(application: any) {
  return (
    application?.woreda?.name ||
    application?.subcity?.name ||
    application?.city?.name ||
    "-"
  );
}

export default function DashboardTrackApplicationPage() {
  const searchParams = useSearchParams();
  const initialTracking =
    searchParams.get("tracking") ||
    searchParams.get("tracking_number") ||
    searchParams.get("application_number") ||
    "";

  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();

    const tracking = trackingNumber.trim();

    if (!tracking) {
      toast.error("Enter tracking number");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/public/track-application", {
        tracking_number: tracking,
      });
      const found = extractApplication(response);
      if (!found?.id && !found?.tracking_number) {
        throw new Error("Application not found");
      }
      setApplication(found);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        error?.message ||
        "Application not found";
      setApplication(null);
      toast.error(String(message));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (initialTracking) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTracking]);

  const appointment = latestAppointment(application);
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Track Application</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your tracking number to check status, appointment schedule,
            documents, and workflow progress.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="Example: ADA-2026-000001"
            />

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Track
            </Button>
          </form>
        </CardContent>
      </Card>

      {application ? (
        <>
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {application.tracking_number || "-"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {application.service?.name || `Service #${application.service_id || "-"}`}
                </p>
              </div>

              <ApplicationStatusBadge status={application.status} />
            </div>
          </div>

          {appointment && (
            <Card className="rounded-3xl border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Appointment Schedule
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-4">
                <Info label="Appointment Date" value={formatDate(appointment.appointment_at)} />
                <Info label="Appointment Time" value={formatTime(appointment.appointment_at)} />
                <Info label="Location" value={appointment.location || "-"} />
                <Info label="Status" value={appointment.status || "scheduled"} />
                {appointment.message && (
                  <div className="rounded-2xl border bg-background p-4 md:col-span-4">
                    <p className="text-sm text-muted-foreground">Officer Message</p>
                    <p className="mt-1 font-medium">{appointment.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="rounded-3xl xl:col-span-2">
              <CardHeader>
                <CardTitle>Application Information</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <Info label="Service" value={application.service?.name || application.service_id || "-"} />
                <Info label="Tracking Number" value={application.tracking_number || "-"} />
                <Info label="Administrative Level" value={application.administrative_level || "-"} />
                <Info label="Location" value={locationText(application)} />
                <Info label="Submitted Date" value={formatDateTime(application.submitted_at)} />
                <Info label="Last Updated" value={formatDateTime(application.updated_at)} />
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Current Status
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <ApplicationStatusBadge status={application.status} />
                {application.current_window && (
                  <p className="text-sm text-muted-foreground">
                    Current Window:{" "}
                    {application.current_window.display_name || application.current_window.name}
                  </p>
                )}
                {application.rejection_reason && (
                  <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                    {application.rejection_reason}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Workflow Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ApplicationWorkflowTimeline
                  workflow={application.workflow || application.workflows}
                  histories={application.histories}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ApplicationFilesList files={application.files} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Search by tracking number to display application details.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value || "-"}</p>
    </div>
  );
}
