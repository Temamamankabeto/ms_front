"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  useOfficerQueue,
  useApproveApplication,
} from "@/hooks/application/use-application";

export default function OfficerApplicationsPage() {

  const {
    data,
    isLoading,
  } = useOfficerQueue();

  const approveMutation =
    useApproveApplication();

  const applications =
    (data as any)?.data?.data || [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-5">

      <h1 className="text-3xl font-bold">
        Officer Queue
      </h1>

      {applications.map(
        (application: any) => (

          <Card
            key={application.id}
          >

            <CardContent className="flex items-center justify-between p-5">

              <div>

                <h2 className="font-bold">
                  {
                    application.service.name
                  }
                </h2>

                <p className="text-sm text-muted-foreground">
                  {
                    application.tracking_number
                  }
                </p>
              </div>

              <Button
                onClick={() =>
                  approveMutation.mutate({
                    id: application.id,
                    payload: {
                      remark:
                        "Approved",
                    },
                  })
                }
              >
                Approve
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}