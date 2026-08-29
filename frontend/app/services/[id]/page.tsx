"use client";

import { getToken } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { normalizeRoleName } from "@/config/roles.config";
import { usePublicService } from "@/hooks/public-service/use-public-service";
import { authService } from "@/services/auth/auth.service";

function selectionQuery(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  ["administrative_level", "city_id", "subcity_id", "woreda_id"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  });

  return params.toString();
}

function criteriaLines(criterion: any) {
  if (Array.isArray(criterion?.criteria_items) && criterion.criteria_items.length) {
    return criterion.criteria_items;
  }

  return String(criterion?.criteria || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function allCriteriaItems(service: any) {
  const criteria = Array.isArray(service?.criteria) ? service.criteria : [];

  return criteria
    .filter((item: any) => item?.is_active !== false)
    .flatMap((item: any) =>
      criteriaLines(item).map((line: string) => ({
        title: item.title || "Service Criteria",
        line,
      }))
    );
}

function applySteps(service: any) {
  const steps = [
    "Login or create customer account",
    "Click Start Application",
    "Fill the service form carefully",
    "Upload required files if requested",
    "Submit and track your application",
  ];

  if (service?.has_back_officer) {
    steps.push("Wait for office review and final decision");
  } else {
    steps.push("Wait for front office completion");
  }

  return steps;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Number(params.id);
  const { data, isLoading } = usePublicService(id);

  const service = data?.data;
  const selectedLevel = searchParams.get("administrative_level");
  const applyQuery = selectionQuery(searchParams);
  const applyUrl = `/services/${id}/apply${applyQuery ? `?${applyQuery}` : ""}`;

  function handleApply() {
    const token =
      getToken();

    const roles = authService.getStoredRoles();
    const role = normalizeRoleName(roles[0] || authService.getStoredUser()?.role || "");

    if (!token) {
      toast.error("Please login or register as a customer before applying.");
      router.push(`/login?redirect=${encodeURIComponent(applyUrl)}`);
      return;
    }

    if (role !== "customer") {
      toast.error("Only customers can apply for public services. Please login with a customer account.");
      router.push(`/login?redirect=${encodeURIComponent(applyUrl)}`);
      return;
    }

    router.push(applyUrl);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg rounded-3xl">
          <CardContent className="p-10 text-center">
            <Building2 className="mx-auto h-14 w-14 text-muted-foreground" />
            <h2 className="mt-5 text-2xl font-bold">Service Not Found</h2>
            <p className="mt-2 text-muted-foreground">The requested service does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criteria = allCriteriaItems(service);
  const steps = applySteps(service);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="rounded-3xl border bg-background p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Badge className="rounded-full px-4 py-1">Government eService</Badge>

              <h1 className="text-4xl font-bold tracking-tight">{service.name}</h1>

              {service.description && (
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  {service.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="rounded-full">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Secure Digital Service
                </Badge>

                {selectedLevel && (
                  <Badge variant="outline" className="rounded-full capitalize">
                    <MapPin className="mr-2 h-4 w-4" />
                    {selectedLevel} level
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex min-w-[260px] flex-col gap-3">
              <Button type="button" size="lg" className="w-full rounded-2xl" onClick={handleApply}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-2xl">
                <Link href="/services">Change Location</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-3xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Service Criteria</CardTitle>
            </CardHeader>

            <CardContent>
              <h3 className="flex items-center gap-2 font-semibold">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Required Criteria
              </h3>

              {criteria.length ? (
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {criteria.map((item: any, index: number) => (
                    <li key={`${item.title}-${index}`} className="flex gap-3 rounded-2xl border p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{item.line}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.title}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  No criteria has been configured for this service yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Steps to Apply</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm text-muted-foreground">{step}</p>
                </div>
              ))}

              <Separator />

              <Button type="button" className="w-full rounded-2xl" onClick={handleApply}>
                Start Application
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Before You Apply
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Please read the criteria carefully and prepare the required information before starting the application.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
