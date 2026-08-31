"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
} from "lucide-react";

import ApplicationFilesList from "@/components/application/ApplicationFilesList";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import ApplicationWorkflowTimeline from "@/components/application/ApplicationWorkflowTimeline";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useCustomerApplication } from "@/hooks/customer/use-customer-applications";

type NamedRelation = {
  id?: number | string;
  name?: string | null;
  display_name?: string | null;
};

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
  if (
    Array.isArray(application?.appointments) &&
    application.appointments.length
  ) {
    return application.appointments[0];
  }

  if (application?.appointment_at) {
    return {
      id: "current",
      appointment_at: application.appointment_at,
      location: application.appointment_location,
      message: application.appointment_message,
      status: application.appointment_status,
    };
  }

  return null;
}

function locationText(data: any) {
  return (
    data?.woreda?.name ||
    data?.subcity?.name ||
    data?.city?.name ||
    "-"
  );
}

function relationName(relation?: NamedRelation | null) {
  if (!relation) return "-";

  return relation.display_name || relation.name || "-";
}

export default function DashboardMyApplicationDetailPage() {
  const params = useParams();

  const id = Number(params.id);

  const { data, isLoading } = useCustomerApplication(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading application...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Application not found.
        </p>
      </div>
    );
  }

  const appointment = latestAppointment(data);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
      <Button asChild variant="outline">
        <Link href="/dashboard/my-applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Link>
      </Button>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Application Number
            </p>

            <h1 className="text-3xl font-bold">
              {data.tracking_number}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {data.service?.name || data.service_id}
            </p>
          </div>

          <ApplicationStatusBadge status={data.status} />
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
            <Info
              label="Appointment Date"
              value={formatDate(appointment.appointment_at)}
            />

            <Info
              label="Appointment Time"
              value={formatTime(appointment.appointment_at)}
            />

            <Info
              label="Location"
              value={appointment.location || "-"}
            />

            <Info
              label="Status"
              value={appointment.status || "scheduled"}
            />

            {appointment.message && (
              <div className="rounded-2xl border bg-background p-4 md:col-span-4">
                <p className="text-sm text-muted-foreground">
                  Officer Message
                </p>

                <p className="mt-1 font-medium">
                  {appointment.message}
                </p>
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
            <Info
              label="Service"
              value={data.service?.name || data.service_id}
            />

            <Info
              label="Tracking Number"
              value={data.tracking_number}
            />

            <Info
              label="Administrative Level"
              value={data.administrative_level || "-"}
            />

            <Info
              label="Location"
              value={locationText(data)}
            />

            <Info
              label="Submitted Date"
              value={formatDateTime(data.submitted_at)}
            />

            <Info
              label="Completed Date"
              value={formatDateTime(data.completed_at)}
            />
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
            <ApplicationStatusBadge status={data.status} />

            {data.current_window && (
              <p className="text-sm text-muted-foreground">
                Current Window:{" "}
                {relationName(data.current_window)}
              </p>
            )}

            {data.current_officer && (
              <p className="text-sm text-muted-foreground">
                Current Officer:{" "}
                {relationName(data.current_officer)}
              </p>
            )}

            {data.rejection_reason && (
              <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {data.rejection_reason}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Submitted Data
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.data?.length ? (
              data.data.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl border p-4"
                >
                  <p className="text-sm font-medium">
                    {item.field_name}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.field_value || "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No submitted data found.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>

          <CardContent>
            <ApplicationFilesList files={data.files} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Workflow Timeline
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ApplicationWorkflowTimeline
            workflow={data.workflow || data.workflows}
            histories={data.histories}
          />
        </CardContent>
      </Card>
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
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium capitalize">
        {value || "-"}
      </p>
    </div>
  );
}