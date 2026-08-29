"use client";

import { getToken } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { authService } from "@/services/auth/auth.service";
import { normalizeRoleName } from "@/config/roles.config";

import {
  useApplicationForm,
  useApplyService,
} from "@/hooks/application/use-application";

import DynamicFieldRenderer from "@/components/application/DynamicFieldRenderer";

import {
  ServiceFormField,
  ServiceFormSection,
  ServiceFormStep,
} from "@/types/application-workflow";

/**
 * TYPES
 */
type ApplicationFormResponse = {
  data?: {
    title?: string;
    description?: string;
    fields?: ServiceFormField[];
    sections?: ServiceFormSection[];
    steps?: ServiceFormStep[];
  };
};

type ApplyResponse = {
  data?: {
    tracking_number?: string;
  };
};

/**
 * HELPERS
 */
function getSectionId(field: ServiceFormField) {
  return field.section_id ?? field.service_form_section_id ?? 0;
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = Number(params.id);

  const administrativeLevel =
    searchParams.get("administrative_level") || "";

  const cityId = Number(searchParams.get("city_id") || 0);

  const subcityId = searchParams.get("subcity_id")
    ? Number(searchParams.get("subcity_id"))
    : null;

  const woredaId = searchParams.get("woreda_id")
    ? Number(searchParams.get("woreda_id"))
    : null;

  const [formValues, setFormValues] = useState<
    Record<string, unknown>
  >({});

  const [files, setFiles] = useState<
    Record<string, File | null>
  >({});

  const [currentStep, setCurrentStep] = useState(0);

  /**
   * FETCH FORM
   */
  const { data, isLoading } =
    useApplicationForm(serviceId) as {
      data?: ApplicationFormResponse;
      isLoading: boolean;
    };

  const applyMutation = useApplyService(serviceId);

  /**
   * FORM DATA
   */
  const form = data?.data;

  const fields: ServiceFormField[] = form?.fields || [];

  const sections: ServiceFormSection[] =
    form?.sections || [];

  const steps: ServiceFormStep[] = form?.steps || [];

  /**
   * CURRENT PATH
   */
  const currentPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : `/services/${serviceId}/apply`;

  /**
   * AUTH CHECK
   */
  useEffect(() => {
    const token =
      getToken();

    const roles = authService.getStoredRoles();

    const role = normalizeRoleName(
      roles[0] ||
        authService.getStoredUser()?.role ||
        ""
    );

    if (!token) {
      toast.error(
        "Please login or register as a customer before applying."
      );

      router.replace(
        `/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );

      return;
    }

    if (role !== "customer") {
      toast.error(
        "Only customers can apply for public services."
      );

      router.replace(
        `/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );
    }
  }, [router, currentPath]);

  /**
   * VALID LOCATION
   */
  const hasValidSelection =
    ["city", "subcity", "woreda"].includes(
      administrativeLevel
    ) &&
    cityId > 0 &&
    (administrativeLevel !== "subcity" ||
      Boolean(subcityId)) &&
    (administrativeLevel !== "woreda" ||
      Boolean(subcityId && woredaId));

  /**
   * GROUP STEPS
   */
  const groupedSteps = useMemo(() => {
    if (steps.length) {
      return steps
        .slice()
        .sort(
          (a, b) =>
            Number(
              a.step_order || a.sort_order || 0
            ) -
            Number(
              b.step_order || b.sort_order || 0
            )
        )
        .map((step) => {
          const stepSections = sections.filter(
            (section) =>
              section.service_form_step_id ===
              step.id
          );

          const sectionIds = new Set(
            stepSections.map(
              (section) => section.id
            )
          );

          return {
            title: step.title,
            sections: stepSections.length
              ? stepSections
              : sections,

            fields: fields.filter(
              (field) =>
                !sectionIds.size ||
                sectionIds.has(
                  getSectionId(field)
                )
            ),
          };
        });
    }

    if (sections.length) {
      return sections
        .slice()
        .sort(
          (a, b) =>
            Number(a.sort_order || 0) -
            Number(b.sort_order || 0)
        )
        .map((section) => ({
          title: section.title,
          sections: [section],
          fields: fields.filter(
            (field) =>
              getSectionId(field) === section.id
          ),
        }));
    }

    return [
      {
        title: "Application Information",
        sections: [],
        fields,
      },
    ];
  }, [fields, sections, steps]);

  /**
   * CURRENT STEP
   */
  const current = groupedSteps[currentStep];

  const progress =
    groupedSteps.length > 0
      ? ((currentStep + 1) /
          groupedSteps.length) *
        100
      : 0;

  /**
   * HANDLE CHANGE
   */
  function handleChange(
    name: string,
    value: unknown
  ) {
    if (value instanceof File) {
      setFiles((currentFiles) => ({
        ...currentFiles,
        [name]: value,
      }));

      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  /**
   * VALIDATE STEP
   */
  function validateCurrentStep() {
    const missing = current?.fields?.find(
      (field) => {
        if (!field.is_required) {
          return false;
        }

        if (
          ["file", "image"].includes(field.type)
        ) {
          return !files[field.name];
        }

        return (
          formValues[field.name] ===
            undefined ||
          formValues[field.name] === null ||
          formValues[field.name] === ""
        );
      }
    );

    if (missing) {
      toast.error(
        `${missing.label} is required`
      );

      return false;
    }

    return true;
  }

  /**
   * NEXT STEP
   */
  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    if (
      currentStep <
      groupedSteps.length - 1
    ) {
      setCurrentStep((step) => step + 1);
    }
  }

  /**
   * SUBMIT
   */
  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const roles =
      authService.getStoredRoles();

    const role = normalizeRoleName(
      roles[0] ||
        authService.getStoredUser()?.role ||
        ""
    );

    if (role !== "customer") {
      toast.error(
        "Only customers can apply for public services."
      );

      router.replace(
        `/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );

      return;
    }

    if (!hasValidSelection) {
      toast.error(
        "Please select service location first."
      );

      router.push("/services");

      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    try {
      const response =
        (await applyMutation.mutateAsync({
          values: formValues,
          files,
          selection: {
            administrative_level:
              administrativeLevel,
            city_id: cityId,
            subcity_id: subcityId,
            woreda_id: woredaId,
          },
        })) as ApplyResponse;

      const trackingNumber =
        response?.data?.tracking_number;

      toast.success(
        "Application submitted successfully"
      );

      router.push(
        trackingNumber
          ? `/track-application?tracking=${trackingNumber}`
          : "/my-applications"
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Submission failed"
      );
    }
  }

  /**
   * NO LOCATION
   */
  if (!hasValidSelection) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-8 text-center">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />

            <h1 className="text-xl font-bold">
              Select Location First
            </h1>

            <p className="text-muted-foreground">
              You must choose City
              Level, Subcity Level,
              or Woreda Level before
              applying.
            </p>

            <Button
              onClick={() =>
                router.push("/services")
              }
            >
              Choose Service
              Location
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * LOADING
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  /**
   * NO FORM
   */
  if (!form) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            No active form found for
            this service.
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * UI
   */
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl p-6">
        <Card className="mb-4 rounded-3xl">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />

              Applying at{" "}
              <strong className="capitalize text-foreground">
                {administrativeLevel}
              </strong>{" "}
              level
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push("/services")
              }
            >
              Change Location
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-3xl">
                  {form.title ||
                    "Apply for Service"}
                </CardTitle>

                <p className="mt-2 text-sm text-muted-foreground">
                  {form.description ||
                    "Complete the application form."}
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Step{" "}
                {currentStep + 1} of{" "}
                {groupedSteps.length ||
                  1}
              </div>
            </div>

            <Progress value={progress} />
          </CardHeader>

          <CardContent>
            <form
              onSubmit={submit}
              className="space-y-8"
            >
              <div className="rounded-2xl border bg-muted/20 p-6">
                <h2 className="mb-6 text-xl font-semibold">
                  {current?.title ||
                    "Application Form"}
                </h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(current?.fields || [])
                    .slice()
                    .sort(
                      (a, b) =>
                        Number(
                          a.sort_order ||
                            0
                        ) -
                        Number(
                          b.sort_order ||
                            0
                        )
                    )
                    .map((field) => (
                      <div
                        key={field.id}
                        className={
                          field.width ===
                            "full" ||
                          !field.width
                            ? "md:col-span-2"
                            : ""
                        }
                      >
                        <DynamicFieldRenderer
                          field={field}
                          value={
                            formValues[
                              field.name
                            ]
                          }
                          values={
                            formValues
                          }
                          onChange={
                            handleChange
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentStep(
                      (step) =>
                        Math.max(
                          0,
                          step - 1
                        )
                    )
                  }
                  disabled={
                    currentStep === 0
                  }
                  className="rounded-2xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep <
                groupedSteps.length -
                  1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="rounded-2xl"
                  >
                    Next

                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      applyMutation.isPending
                    }
                    className="rounded-2xl"
                  >
                    {applyMutation.isPending
                      ? "Submitting..."
                      : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}