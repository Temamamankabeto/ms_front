"use client";

import { useEffect, useState } from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  useApplicationDetails,
  useResubmitApplication,
} from "@/hooks/application/use-application";

import DynamicFieldRenderer from "@/components/application/DynamicFieldRenderer";

export default function EditApplicationPage() {

  const params = useParams();

  const router = useRouter();

  const id = Number(params.id);

  const {
    data,
    isLoading,
  } = useApplicationDetails(id);

  const resubmitMutation =
    useResubmitApplication(id);

  const application =
    data?.data;

  const [formValues, setFormValues] =
    useState<any>({});

  const [files, setFiles] =
    useState<any>({});

  useEffect(() => {

    if (!application) return;

    const initialValues: any = {};

    application.answers?.forEach(
      (item: any) => {
        initialValues[item.field_name] =
          item.value;
      }
    );

    setFormValues(initialValues);

  }, [application]);

  const handleChange = (
    name: string,
    value: any
  ) => {

    if (value instanceof File) {

      setFiles({
        ...files,
        [name]: value,
      });

      return;
    }

    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      const payload =
        new FormData();

      Object.keys(formValues).forEach(
        (key) => {
          payload.append(
            key,
            formValues[key]
          );
        }
      );

      Object.keys(files).forEach(
        (key) => {
          payload.append(
            key,
            files[key]
          );
        }
      );

      await resubmitMutation.mutateAsync(
        payload
      );

      router.push(
        `/my-applications/${id}`
      );

    } catch (error) {
      console.error(error);
    }
  };

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

            <div className="flex items-center justify-between">

              <div>

                <CardTitle className="text-3xl">
                  Edit Returned Application
                </CardTitle>

                <p className="mt-2 text-sm text-muted-foreground">
                  Update the returned application and resubmit it.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  router.back()
                }
                className="rounded-2xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardHeader>

          <CardContent>

            <form
              onSubmit={handleSubmit}
              className="space-y-8"
            >

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {application?.fields?.map(
                  (field: any) => (

                    <div
                      key={field.id}
                      className={
                        field.width === "full"
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
                        onChange={
                          handleChange
                        }
                      />
                    </div>
                  )
                )}
              </div>

              <div className="flex justify-end">

                <Button
                  type="submit"
                  disabled={
                    resubmitMutation.isPending
                  }
                  className="rounded-2xl"
                >
                  <Save className="mr-2 h-4 w-4" />

                  {resubmitMutation.isPending
                    ? "Resubmitting..."
                    : "Resubmit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
