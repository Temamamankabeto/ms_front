"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import DynamicFieldRenderer from "@/components/application/DynamicFieldRenderer";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  useApplicationDetails,
  useApplicationForm,
  useResubmitApplication,
} from "@/hooks/application/use-application";

import type {
  ServiceFormField,
  ServiceFormSection,
  ServiceFormStep,
} from "@/types/application-workflow";

function getSectionId(field: ServiceFormField) {
  return field.section_id ?? field.service_form_section_id ?? 0;
}

function fieldGridClass(field: ServiceFormField) {
  const width = String(field.width || "").toLowerCase();

  if (width === "full") return "md:col-span-2";
  if (width === "third") return "lg:col-span-1";
  if (["quarter", "half"].includes(width)) return "";

  return ["textarea", "file", "image"].includes(field.type)
    ? "md:col-span-2"
    : "";
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || typeof parsed === "object") return parsed;
    } catch {
      // Keep original string.
    }
  }

  return value;
}

function dateTime(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function latestReturnReason(application: any) {
  return (
    application?.rejection_reason ||
    application?.histories?.find((history: any) =>
      ["rejected", "returned", "returned_to_customer", "back_officer_rejected"].includes(
        String(history.to_status || history.status || "").toLowerCase()
      )
    )?.remark ||
    application?.histories?.find((history: any) =>
      String(history.action || "").toLowerCase().includes("reject")
    )?.remark ||
    null
  );
}

function buildFallbackFields(application: any): ServiceFormField[] {
  return (application?.data || application?.answers || []).map((item: any, index: number) => {
    const name = item.field_name || `field_${index + 1}`;
    const label = item.field_label || item.label || name;

    return {
      id: item.id || index + 1,
      service_form_id: application?.service_id || 0,
      name,
      label,
      type: "text",
      sort_order: index + 1,
      width: "full",
      is_active: true,
      is_required: false,
    } as ServiceFormField;
  });
}

export default function DashboardReturnedApplicationEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: applicationResponse, isLoading: applicationLoading } =
    useApplicationDetails(id);

  const application = (applicationResponse as any)?.data ?? applicationResponse;
  const serviceId = Number(application?.service_id ?? application?.service?.id ?? 0);

  const { data: formResponse, isLoading: formLoading } = useApplicationForm(serviceId);
  const form = (formResponse as any)?.data ?? formResponse;

  const resubmitMutation = useResubmitApplication(id);

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [remark, setRemark] = useState("");

  const fields: ServiceFormField[] = useMemo(() => {
    const realFields: ServiceFormField[] = form?.fields || [];

    if (realFields.length) {
      return realFields
        .filter((field) => field.is_active !== false)
        .slice()
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    }

    return buildFallbackFields(application);
  }, [form?.fields, application]);

  const sections: ServiceFormSection[] = useMemo(
    () =>
      (form?.sections || [])
        .filter((section: ServiceFormSection) => section.is_active !== false)
        .slice()
        .sort((a: ServiceFormSection, b: ServiceFormSection) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
        ),
    [form?.sections]
  );

  const steps: ServiceFormStep[] = useMemo(
    () =>
      (form?.steps || [])
        .filter((step: ServiceFormStep) => step.is_active !== false)
        .slice()
        .sort((a: ServiceFormStep, b: ServiceFormStep) =>
          Number(a.step_order || a.sort_order || 0) -
          Number(b.step_order || b.sort_order || 0)
        ),
    [form?.steps]
  );

  const groupedSteps = useMemo(() => {
    if (steps.length) {
      return steps.map((step) => {
        const stepSections = sections.filter(
          (section) => section.service_form_step_id === step.id
        );

        const sectionIds = new Set(stepSections.map((section) => section.id));

        return {
          id: step.id,
          title: step.title || "Application Information",
          description: step.description,
          sections: stepSections,
          fields: fields.filter(
            (field) => !sectionIds.size || sectionIds.has(getSectionId(field))
          ),
        };
      });
    }

    if (sections.length) {
      return sections.map((section) => ({
        id: section.id,
        title: section.title || "Application Information",
        description: section.description,
        sections: [section],
        fields: fields.filter((field) => getSectionId(field) === section.id),
      }));
    }

    return [
      {
        id: 1,
        title: form?.title || "Application Information",
        description: form?.description,
        sections: [],
        fields,
      },
    ];
  }, [fields, form?.description, form?.title, sections, steps]);

  useEffect(() => {
    if (!application) return;

    const initialValues: Record<string, any> = {};

    (application.data || application.answers || []).forEach((item: any) => {
      const name = item.field_name || item.name;
      if (!name) return;

      initialValues[name] = normalizeValue(item.field_value ?? item.value);
    });

    setFormValues(initialValues);
  }, [application?.id]);

  function handleChange(name: string, value: any) {
    if (value instanceof File) {
      setFiles((current) => ({
        ...current,
        [name]: value,
      }));

      return;
    }

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validate() {
    const missingField = fields.find((field) => {
      if (!field.is_required || field.type === "file" || field.type === "image") {
        return false;
      }

      const value = formValues[field.name];

      return value === undefined || value === null || value === "";
    });

    if (missingField) {
      toast.error(`${missingField.label} is required.`);
      return false;
    }

    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!validate()) return;

    try {
      const payload = new FormData();

      Object.entries(formValues).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((item) => payload.append(`data[${key}][]`, String(item)));
          return;
        }

        payload.append(`data[${key}]`, String(value));
      });

      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          payload.append(`files[${key}]`, file);
        }
      });

      if (remark.trim()) {
        payload.append("remark", remark.trim());
      }

      await resubmitMutation.mutateAsync(payload);

      toast.success("Application resubmitted successfully.");
      router.push(`/dashboard/my-applications/${id}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to resubmit application.");
    }
  }

  if (applicationLoading || formLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading returned application form...
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md rounded-3xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Application not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The application you are trying to resubmit could not be found.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/my-applications">Back to My Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const returnReason = latestReturnReason(application);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <RefreshCcw className="h-3.5 w-3.5" />
              Returned Application Resubmission
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">
              Resubmit Application
            </h1>

            <p className="max-w-3xl text-sm text-muted-foreground">
              Update the same service form you submitted before, correct the requested
              information, attach replacement documents if needed, then resubmit it for
              officer review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href={`/dashboard/my-applications/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Detail
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/dashboard/my-applications">All Applications</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl lg:col-span-3">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Tracking Number
              </p>
              <p className="mt-1 font-semibold">{application.tracking_number}</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Service
              </p>
              <p className="mt-1 font-semibold">
                {application.service?.name || application.service_name || "-"}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Submitted Date
              </p>
              <p className="mt-1 font-semibold">{dateTime(application.submitted_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="flex h-full flex-col justify-center gap-2 p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Current Status
            </p>
            <ApplicationStatusBadge status={application.status} />
          </CardContent>
        </Card>
      </div>

      {returnReason ? (
        <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
          <CardContent className="flex gap-3 p-5">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-semibold text-destructive">Reason for return/rejection</h2>
              <p className="mt-1 text-sm text-destructive/90">{returnReason}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={submit} className="space-y-6">
        <Card className="rounded-3xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {form?.title || "Application Form"}
            </CardTitle>
            {form?.description ? (
              <p className="text-sm text-muted-foreground">{form.description}</p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            {groupedSteps.map((group, index) => (
              <section key={group.id ?? index} className="rounded-3xl border bg-background">
                <div className="border-b bg-muted/20 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>

                    <div>
                      <h2 className="font-semibold">{group.title}</h2>
                      {group.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                  {group.fields.length ? (
                    group.fields.map((field) => (
                      <div key={field.id || field.name} className={fieldGridClass(field)}>
                        <DynamicFieldRenderer
                          field={field}
                          value={formValues[field.name]}
                          values={formValues}
                          onChange={handleChange}
                        />

                        {["file", "image"].includes(field.type) ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Upload a new file only if you need to replace or add documents.
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground md:col-span-2">
                      No fields found for this section.
                    </p>
                  )}
                </div>
              </section>
            ))}

            {application.files?.length ? (
              <section className="rounded-3xl border bg-muted/10 p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  Previously Uploaded Documents
                </h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {application.files.map((file: any) => (
                    <div key={file.id} className="rounded-2xl border bg-background p-4">
                      <p className="font-medium">{file.original_name || file.stored_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Field: {file.field_name || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border bg-muted/10 p-5">
              <label className="text-sm font-semibold">
                Resubmission note
              </label>

              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Write what you corrected before resubmitting..."
                className="mt-2 min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </section>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 rounded-3xl border bg-card/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Review your corrections before resubmitting.
            </div>

            <div className="flex gap-2">
              <Button asChild type="button" variant="outline" className="rounded-2xl">
                <Link href={`/dashboard/my-applications/${id}`}>Cancel</Link>
              </Button>

              <Button
                type="submit"
                disabled={resubmitMutation.isPending}
                className="rounded-2xl"
              >
                {resubmitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {resubmitMutation.isPending
                  ? "Resubmitting..."
                  : "Resubmit Application"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
