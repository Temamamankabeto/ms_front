"use client";

import { useState } from "react";

import { useParams } from "next/navigation";

import {
  CheckCircle2,
  Clock3,
  FileWarning,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  useApplicationDetails,
  useOfficerAction,
} from "@/hooks/application/use-application";

export default function OfficerApplicationReviewPage() {

  const params = useParams();

  const id = Number(params.id);

  const [comment, setComment] =
    useState("");

  const {
    data,
    isLoading,
  } = useApplicationDetails(id);

  const actionMutation =
    useOfficerAction(id);

  const application =
    data?.data;

  const handleAction = async (
    action: string
  ) => {

    try {

      await actionMutation.mutateAsync({
        action,
        comment,
      });

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

      <div className="mx-auto max-w-7xl space-y-6 p-6">

        <div className="rounded-3xl border bg-background p-8 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <Badge className="rounded-full px-4 py-1">
                Officer Review Panel
              </Badge>

              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                {application?.service_name}
              </h1>

              <p className="mt-2 text-muted-foreground">
                Application workflow review and approval processing.
              </p>
            </div>

            <div className="flex gap-3">

              <Badge
                variant="secondary"
                className="rounded-full px-5 py-2"
              >
                {application?.status}
              </Badge>

              <Badge
                variant="outline"
                className="rounded-full px-5 py-2"
              >
                {application?.priority || "normal"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-5 w-5" />
                Current Stage
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                {application?.current_stage || "Submitted"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5" />
                Applicant
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                {application?.applicant_name || "Citizen"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5" />
                Assigned Role
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                {application?.assigned_role || "Front Officer"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileWarning className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                {application?.files_count || 0} Files
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="application"
          className="space-y-6"
        >

          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="application">
              Application
            </TabsTrigger>

            <TabsTrigger value="documents">
              Documents
            </TabsTrigger>

            <TabsTrigger value="timeline">
              Timeline
            </TabsTrigger>

            <TabsTrigger value="workflow">
              Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="application">

            <Card className="rounded-3xl">

              <CardHeader>
                <CardTitle>
                  Application Data
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">

                {application?.answers?.map(
                  (answer: any) => (

                    <div
                      key={answer.id}
                      className="rounded-2xl border p-5"
                    >
                      <h3 className="font-semibold">
                        {answer.field_label}
                      </h3>

                      <p className="mt-2 text-muted-foreground">
                        {answer.value}
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">

            <Card className="rounded-3xl">

              <CardHeader>
                <CardTitle>
                  Uploaded Documents
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">

                {application?.files?.map(
                  (file: any) => (

                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border p-5"
                    >
                      <div>
                        <h3 className="font-medium">
                          {file.original_name}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {file.verification_status || "pending"}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-2xl"
                      >
                        Verify
                      </Button>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">

            <Card className="rounded-3xl">

              <CardHeader>
                <CardTitle>
                  Workflow Timeline
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">

                {(application?.histories || []).map(
                  (history: any, index: number) => (

                    <div
                      key={index}
                      className="flex gap-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {history.action}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {history.comment}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow">

            <Card className="rounded-3xl">

              <CardHeader>
                <CardTitle>
                  Workflow Actions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">

                <Textarea
                  placeholder="Officer review comment..."
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  className="min-h-[140px] rounded-2xl"
                />

                <div className="flex flex-wrap gap-3">

                  <Button
                    onClick={() =>
                      handleAction("approve")
                    }
                    className="rounded-2xl"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleAction("reject")
                    }
                    className="rounded-2xl"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleAction("return")
                    }
                    className="rounded-2xl"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Return for Correction
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
