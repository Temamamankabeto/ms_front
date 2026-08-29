"use client";

import { getToken } from "@/lib/api";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { authService } from "@/services/auth/auth.service";

import { normalizeRoleName } from "@/config/roles.config";

import {
  useApplicationForm,
  useApplyService,
} from "@/hooks/application/use-application";

import DynamicFieldRenderer from "@/components/application/DynamicFieldRenderer";

import type {
  ServiceFormField,
  ServiceFormSection,
  ServiceFormStep,
} from "@/types/application-workflow";

function getSectionId(
  field: ServiceFormField
) {
  return (
    field.section_id ??
    field.service_form_section_id ??
    0
  );
}

function ApplyPageContent() {
  const params = useParams();

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const serviceId = Number(
    params.id
  );

  const administrativeLevel =
    searchParams.get(
      "administrative_level"
    ) || "";

  const cityId = Number(
    searchParams.get(
      "city_id"
    ) || 0
  );

  const subcityId =
    searchParams.get(
      "subcity_id"
    )
      ? Number(
          searchParams.get(
            "subcity_id"
          )
        )
      : null;

  const woredaId =
    searchParams.get(
      "woreda_id"
    )
      ? Number(
          searchParams.get(
            "woreda_id"
          )
        )
      : null;

  const [
    formValues,
    setFormValues,
  ] = useState<
    Record<string, unknown>
  >({});

  const [files, setFiles] =
    useState<
      Record<
        string,
        File | null
      >
    >({});

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const {
    data,
    isLoading,
  } = useApplicationForm(
    serviceId
  );

  const applyMutation =
    useApplyService(
      serviceId
    );

  const form =
    (data as any)?.data;

  const fields:
    ServiceFormField[] =
    form?.fields || [];

  const sections:
    ServiceFormSection[] =
    form?.sections || [];

  const steps:
    ServiceFormStep[] =
    form?.steps || [];

  const currentPath =
    typeof window !==
    "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : `/services/${serviceId}/apply`;

  useEffect(() => {
    const token = getToken();

    const roles =
      authService.getStoredRoles();

    const role =
      normalizeRoleName(
        roles[0] ||
          authService.getStoredUser()
            ?.role ||
          ""
      );

    if (!token) {
      toast.error(
        "Please login first."
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
        "Only customers can apply."
      );

      router.replace(
        `/login?redirect=${encodeURIComponent(
          currentPath
        )}`
      );
    }
  }, [router, currentPath]);

  const hasValidSelection =
    [
      "city",
      "subcity",
      "woreda",
    ].includes(
      administrativeLevel
    ) &&
    cityId > 0;

  const groupedSteps =
    useMemo(() => {
      if (steps.length) {
        return steps.map(
          (step) => {
            const stepSections =
              sections.filter(
                (
                  section
                ) =>
                  section.service_form_step_id ===
                  step.id
              );

            const sectionIds =
              new Set(
                stepSections.map(
                  (
                    section
                  ) =>
                    section.id
                )
              );

            return {
              title:
                step.title,

              fields:
                fields.filter(
                  (
                    field
                  ) =>
                    !sectionIds.size ||
                    sectionIds.has(
                      getSectionId(
                        field
                      )
                    )
                ),
            };
          }
        );
      }

      return [
        {
          title:
            "Application Information",
          fields,
        },
      ];
    }, [
      fields,
      sections,
      steps,
    ]);

  const current =
    groupedSteps[
      currentStep
    ];

  const progress =
    groupedSteps.length >
    0
      ? ((currentStep + 1) /
          groupedSteps.length) *
        100
      : 0;

  function handleChange(
    name: string,
    value: any
  ) {
    if (
      value instanceof File
    ) {
      setFiles(
        (
          currentFiles
        ) => ({
          ...currentFiles,
          [name]:
            value,
        })
      );

      return;
    }

    setFormValues(
      (
        currentValues
      ) => ({
        ...currentValues,
        [name]:
          value,
      })
    );
  }

  function validateCurrentStep() {
    const missing =
      current?.fields?.find(
        (
          field
        ) => {
          if (
            !field.is_required
          ) {
            return false;
          }

          return !formValues[
            field.name
          ];
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

  function nextStep() {
    if (
      !validateCurrentStep()
    )
      return;

    if (
      currentStep <
      groupedSteps.length -
        1
    ) {
      setCurrentStep(
        (
          step
        ) =>
          step + 1
      );
    }
  }

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !validateCurrentStep()
    )
      return;

    try {
      const response: any =
        await applyMutation.mutateAsync(
          {
            values:
              formValues,

            files,

            selection:
              {
                administrative_level:
                  administrativeLevel,
                city_id:
                  cityId,
                subcity_id:
                  subcityId,
                woreda_id:
                  woredaId,
              },
          }
        );

      const trackingNumber =
        response?.data
          ?.tracking_number;

      toast.success(
        "Application submitted successfully"
      );

      router.push(
        trackingNumber
          ? `/track-application?tracking=${trackingNumber}`
          : "/my-applications"
      );
    } catch (
      error: any
    ) {
      toast.error(
        error?.message ||
          "Submission failed"
      );
    }
  }

  if (
    !hasValidSelection
  ) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-8 text-center">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />

            <h1 className="text-xl font-bold">
              Select Location First
            </h1>

            <Button
              onClick={() =>
                router.push(
                  "/services"
                )
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl p-6">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              {form?.title ||
                "Apply for Service"}
            </CardTitle>

            <Progress
              value={
                progress
              }
            />
          </CardHeader>

          <CardContent>
            <form
              onSubmit={
                submit
              }
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(
                  current?.fields ||
                  []
                ).map(
                  (
                    field
                  ) => (
                    <DynamicFieldRenderer
                      key={
                        field.id
                      }
                      field={
                        field
                      }
                      value={
                        formValues[
                          field
                            .name
                        ]
                      }
                      values={
                        formValues
                      }
                      onChange={
                        handleChange
                      }
                    />
                  )
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentStep(
                      (
                        step
                      ) =>
                        Math.max(
                          0,
                          step -
                            1
                        )
                    )
                  }
                  disabled={
                    currentStep ===
                    0
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep <
                groupedSteps.length -
                  1 ? (
                  <Button
                    type="button"
                    onClick={
                      nextStep
                    }
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

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ApplyPageContent />
    </Suspense>
  );
}