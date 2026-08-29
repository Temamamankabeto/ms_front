"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import FormBuilderCanvas from "@/components/form-builder/FormBuilderCanvas";
import { Button } from "@/components/ui/button";
import { useServiceFormBuilder } from "@/hooks/application-workflow/use-application-workflow";

export default function ServiceFormBuilderPage() {
  const params = useParams();
  const serviceFormId = Number(params.id);

  const { data, isLoading, error } = useServiceFormBuilder(serviceFormId);

  if (isLoading) {
    return <div className="p-6">Loading builder...</div>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/service-forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="rounded-3xl border p-8 text-muted-foreground">
          Could not load form builder.
          {error instanceof Error && (
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Drag & Drop Form Builder</h1>
          <p className="text-sm text-muted-foreground">Manage steps, sections, fields, ordering, and field conditions.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/dashboard/service-forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Forms
          </Link>
        </Button>
      </div>

      <FormBuilderCanvas serviceFormId={serviceFormId} data={data} />
    </div>
  );
}
